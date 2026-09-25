import { Upload } from "tus-js-client";
import { createBrowserSupabaseClient, type AccessTokenProvider } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/config";
import type { BookRecord, ReadingPosition } from "@/types/book";
import type { ReaderPreferences } from "@/types/reader";
import type { Database } from "@/types/database";

type BookRow = Database["public"]["Tables"]["books"]["Row"];
type ProgressRow = Database["public"]["Tables"]["reading_progress"]["Row"];

function toBook(row: BookRow, progress?: ProgressRow): BookRecord {
  return { id: row.id, metadata: { title: row.title, author: row.author ?? undefined, publisher: row.publisher ?? undefined, language: row.language ?? undefined, description: row.description ?? undefined, identifier: row.epub_identifier ?? undefined }, fileName: row.original_file_name, fileSize: row.file_size, fingerprint: row.file_hash, hasCover: Boolean(row.cover_storage_path), progress: progress?.percentage ?? 0, currentCfi: progress?.cfi ?? undefined, addedAt: row.created_at, updatedAt: progress?.changed_at ?? row.updated_at, lastOpenedAt: row.last_opened_at ?? undefined, ownerUserId: row.user_id, cloudState: "synced" };
}

export class CloudBookRepository {
  private readonly supabase;
  constructor(private readonly userId: string, private readonly accessToken: AccessTokenProvider) {
    this.supabase = createBrowserSupabaseClient(accessToken);
  }
  async listBooks() {
    const { data: books, error } = await this.supabase.from("books").select("*").eq("upload_status", "ready").order("last_opened_at", { ascending: false, nullsFirst: false }).limit(100);
    if (error) throw error; if (!books?.length) return [];
    const { data: progress, error: progressError } = await this.supabase.from("reading_progress").select("*").in("book_id", books.map((book) => book.id));
    if (progressError) throw progressError; const positions = new Map((progress ?? []).map((item) => [item.book_id, item]));
    return books.map((book) => toBook(book, positions.get(book.id)));
  }
  async listDeletions(since?: string) { let query = this.supabase.from("book_deletions").select("*").order("deleted_at"); if (since) query = query.gt("deleted_at", since); const { data, error } = await query; if (error) throw error; return data ?? []; }
  async findByHash(hash: string) { const { data, error } = await this.supabase.from("books").select("*").eq("file_hash", hash).maybeSingle(); if (error) throw error; if (!data) return; const { data: progress } = await this.supabase.from("reading_progress").select("*").eq("book_id", data.id).maybeSingle(); return toBook(data, progress ?? undefined); }
  async createPending(book: BookRecord) {
    const epubPath = `${this.userId}/${book.id}/book.epub`;
    const { data, error } = await this.supabase.from("books").insert({ id: book.id, user_id: this.userId, title: book.metadata.title, author: book.metadata.author ?? null, publisher: book.metadata.publisher ?? null, language: book.metadata.language ?? null, description: book.metadata.description ?? null, epub_identifier: book.metadata.identifier ?? null, original_file_name: book.fileName, file_size: book.fileSize, file_hash: book.fingerprint, epub_storage_path: epubPath, upload_status: "pending", created_at: book.addedAt, updated_at: book.updatedAt }).select("*").single();
    if (error) { if (error.code === "23505") { const existing = await this.findByHash(book.fingerprint); if (existing) return { book: existing, epubPath: `${this.userId}/${existing.id}/book.epub`, duplicate: true }; } throw error; }
    return { book: toBook(data), epubPath, duplicate: false };
  }
  async uploadEpub(path: string, blob: Blob) {
    const token = await this.accessToken(); if (!token) throw new Error("Your session expired. Sign in again.");
    const { url, publishableKey } = getSupabaseConfig(); const projectUrl = new URL(url); const directHost = projectUrl.hostname.endsWith(".supabase.co") ? `${projectUrl.hostname.replace(/\.supabase\.co$/, "")}.storage.supabase.co` : projectUrl.host;
    await new Promise<void>((resolve, reject) => { const upload = new Upload(blob, { endpoint: `${projectUrl.protocol}//${directHost}/storage/v1/upload/resumable`, retryDelays: [0, 1000, 3000, 5000, 10000], headers: { authorization: `Bearer ${token}`, apikey: publishableKey, "x-upsert": "true" }, metadata: { bucketName: "epubs", objectName: path, contentType: "application/epub+zip", cacheControl: "3600" }, uploadDataDuringCreation: true, removeFingerprintOnSuccess: true, onError: reject, onSuccess: () => resolve() }); void upload.findPreviousUploads().then((previous) => { if (previous[0]) upload.resumeFromPreviousUpload(previous[0]); upload.start(); }).catch(reject); });
  }
  async uploadCover(bookId: string, cover: Blob) { const extension = cover.type === "image/png" ? "png" : cover.type === "image/webp" ? "webp" : cover.type === "image/gif" ? "gif" : "jpg"; const path = `${this.userId}/${bookId}/cover.${extension}`; const { error } = await this.supabase.storage.from("covers").upload(path, cover, { contentType: cover.type || "image/jpeg", upsert: true }); if (error) throw error; return path; }
  async finalize(bookId: string, coverPath?: string) { const { error } = await this.supabase.from("books").update({ upload_status: "ready", cover_storage_path: coverPath ?? null }).eq("id", bookId); if (error) throw error; }
  async downloadEpub(bookId: string) { const { data: book, error: bookError } = await this.supabase.from("books").select("epub_storage_path").eq("id", bookId).single(); if (bookError) throw bookError; const { data, error } = await this.supabase.storage.from("epubs").download(book.epub_storage_path); if (error) throw error; return data; }
  async downloadCover(bookId: string) { const { data: book, error: bookError } = await this.supabase.from("books").select("cover_storage_path").eq("id", bookId).single(); if (bookError || !book.cover_storage_path) return; const { data, error } = await this.supabase.storage.from("covers").download(book.cover_storage_path); if (error) throw error; return data; }
  async saveProgress(position: ReadingPosition) { const { error } = await this.supabase.rpc("sync_reading_progress", { p_book_id: position.bookId, p_cfi: position.cfi ?? null, p_percentage: position.percentage, p_changed_at: position.updatedAt }); if (error) throw error; }
  async savePreferences(preferences: ReaderPreferences, changedAt: string) { const { error } = await this.supabase.rpc("sync_reader_preferences", { p_theme: preferences.theme, p_flow: preferences.flow, p_font_family: preferences.fontFamily, p_font_size: preferences.fontSize, p_line_height: preferences.lineHeight, p_content_width: preferences.contentWidth, p_changed_at: changedAt }); if (error) throw error; }
  async getPreferences() { const { data, error } = await this.supabase.from("reader_preferences").select("*").maybeSingle(); if (error) throw error; return data; }
  async markOpened(bookId: string, openedAt: string) { const { error } = await this.supabase.from("books").update({ last_opened_at: openedAt }).eq("id", bookId); if (error) throw error; }
  async getStoragePaths(bookId: string) { const { data, error } = await this.supabase.from("books").select("epub_storage_path,cover_storage_path").eq("id", bookId).single(); if (error) throw error; return data; }
  async deleteBook(bookId: string, paths: { epub_storage_path: string; cover_storage_path: string | null }) { const { error } = await this.supabase.rpc("delete_owned_book", { p_book_id: bookId }); if (error) throw error; if (paths.epub_storage_path) { const result = await this.supabase.storage.from("epubs").remove([paths.epub_storage_path]); if (result.error) throw result.error; } if (paths.cover_storage_path) { const result = await this.supabase.storage.from("covers").remove([paths.cover_storage_path]); if (result.error) throw result.error; } }
}
