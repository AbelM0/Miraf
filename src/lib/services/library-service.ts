import { CloudBookRepository } from "@/lib/cloud/cloud-book-repository";
import { importEpub } from "@/lib/epub/import-book";
import { validateEpubArchive } from "@/lib/epub/validate-epub";
import { IndexedDbBookRepository } from "@/lib/persistence/indexeddb-book-repository";
import type { ReadingPosition } from "@/types/book";
import type { SyncOperation } from "@/types/sync";
import type { ReaderPreferences } from "@/types/reader";
import { defaultPreferences } from "@/stores/reader-store";
import { mergeBookProgress } from "@/lib/sync/conflicts";
import type { AccessTokenProvider } from "@/lib/supabase/browser";

const EVENT = "miraf:library-changed";
const now = () => new Date().toISOString();
function operation(userId: string, kind: SyncOperation["kind"], bookId?: string, payload?: Record<string, unknown>): SyncOperation { const timestamp = now(); return { id: `${userId}:${kind}:${bookId ?? "account"}`, userId, kind, bookId, payload, attempts: 0, createdAt: timestamp, updatedAt: timestamp }; }

export class LibraryService {
  readonly local: IndexedDbBookRepository;
  readonly cloud: CloudBookRepository;
  private progressTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private syncPromise?: Promise<void>;
  private preferenceTimer?: ReturnType<typeof setTimeout>;
  constructor(readonly userId: string, accessToken: AccessTokenProvider) { this.local = new IndexedDbBookRepository(userId); this.cloud = new CloudBookRepository(userId, accessToken); }
  private notify() { window.dispatchEvent(new CustomEvent(EVENT)); }
  listBooks = () => this.local.listBooks();
  listLegacyBooks = () => this.local.listLegacyBooks();
  getBook = (id: string) => this.local.getBook(id);
  async getBookFile(id: string) { const cached = await this.local.getBookFile(id); if (cached) return cached; if (!navigator.onLine) return; const blob = await this.cloud.downloadEpub(id); await validateEpubArchive(blob); await this.local.cacheBookFile(id, blob); return blob; }
  async getBookCover(id: string) { const cached = await this.local.getBookCover(id); if (cached) return cached; if (!navigator.onLine) return; const blob = await this.cloud.downloadCover(id); if (blob) await this.local.cacheBookCover(id, blob); return blob; }
  async importBook(file: File) { const imported = await importEpub(file, this.local); imported.book.ownerUserId = this.userId; imported.book.cloudState = "uploading"; await this.local.saveImportedBook(imported); await this.local.queueOperation(operation(this.userId, "upload", imported.book.id)); this.notify(); void this.processUpload(imported.book.id); return imported.book; }
  private async processUpload(bookId: string) {
    const book = await this.local.getBook(bookId); const file = await this.local.getBookFile(bookId); if (!book || !file || !navigator.onLine) return; const opId = `${this.userId}:upload:${bookId}`;
    try {
      const current = await this.local.getOperation(opId);
      let coverPath = current?.payload?.coverPath as string | undefined;
      if (current?.payload?.stage !== "uploaded") {
        const pending = await this.cloud.createPending(book);
        if (pending.duplicate && pending.book.id !== book.id) { await this.local.rekeyBook(book.id, { ...pending.book, cloudState: "synced" }); await this.local.deleteOperation(opId); this.notify(); return; }
        await this.cloud.uploadEpub(pending.epubPath, file);
        const cover = await this.local.getBookCover(bookId);
        if (cover) { try { coverPath = await this.cloud.uploadCover(bookId, cover); } catch { /* Missing cloud cover uses the existing fallback. */ } }
        await this.local.queueOperation({ ...(current ?? operation(this.userId, "upload", bookId)), payload: { stage: "uploaded", coverPath }, updatedAt: now() });
      }
      await this.cloud.finalize(bookId, coverPath); await this.local.putBook({ ...book, cloudState: "synced", cloudError: undefined, hasCover: Boolean(coverPath || book.hasCover) }); await this.local.deleteOperation(opId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"; await this.local.putBook({ ...book, cloudState: "error", cloudError: message }); const current = await this.local.getOperation(opId); await this.local.queueOperation({ ...(current ?? operation(this.userId, "upload", bookId)), attempts: (current?.attempts ?? 0) + 1, updatedAt: now(), lastError: message });
    } finally { this.notify(); }
  }
  async sync() { if (this.syncPromise) return this.syncPromise; if (!navigator.onLine) return; this.syncPromise = this.performSync().finally(() => { this.syncPromise = undefined; }); return this.syncPromise; }
  private async performSync() {
    const syncStartedAt = now(); const state = await this.local.getAccountState(); const deletions = await this.cloud.listDeletions(state?.lastSyncedAt); for (const deletion of deletions) await this.local.deleteBook(deletion.book_id);
    for (const remote of await this.cloud.listBooks()) {
      const [cached, localPosition] = await Promise.all([
        this.local.getBook(remote.id),
        this.local.getPosition(remote.id),
      ]);
      await this.local.putBook(mergeBookProgress(cached, remote, localPosition?.updatedAt));
    }
    for (const pending of await this.local.listOperations()) { if (pending.kind === "upload" && pending.bookId) await this.processUpload(pending.bookId); if (pending.kind === "progress" && pending.bookId) await this.flushProgress(pending.bookId); if (pending.kind === "delete" && pending.bookId) await this.flushDelete(pending.bookId); if (pending.kind === "preferences") await this.flushPreferences(); }
    const latestState = await this.local.getAccountState();
    await this.local.putAccountState({ userId: this.userId, lastSyncedAt: syncStartedAt, migrationDismissedAt: latestState?.migrationDismissedAt }); this.notify();
  }
  async savePosition(bookId: string, cfi: string | undefined, percentage: number, syncNow = false) { const position: ReadingPosition = { bookId, cfi, percentage, updatedAt: now() }; await this.local.savePosition(position); await this.local.queueOperation(operation(this.userId, "progress", bookId, position as unknown as Record<string, unknown>)); const current = this.progressTimers.get(bookId); if (current) clearTimeout(current); if (syncNow) await this.flushProgress(bookId); else this.progressTimers.set(bookId, setTimeout(() => void this.flushProgress(bookId), 12_000)); }
  async flushProgress(bookId: string) { const op = await this.local.getOperation(`${this.userId}:progress:${bookId}`); if (!op || !navigator.onLine) return; try { await this.cloud.saveProgress(op.payload as unknown as ReadingPosition); await this.local.deleteOperation(op.id); } catch { /* Retry on the next sync trigger. */ } }
  async markOpened(id: string) { const openedAt = now(); await this.local.markOpened(id, openedAt); if (navigator.onLine) void this.cloud.markOpened(id, openedAt).catch(() => undefined); }
  async deleteBook(id: string) { const book = await this.local.getBook(id); if (!book) return; if (!book.ownerUserId) { await this.local.deleteBook(id); this.notify(); return; } await this.local.queueOperation(operation(this.userId, "delete", id)); await this.local.deleteBook(id); this.notify(); if (navigator.onLine) await this.flushDelete(id); }
  private async flushDelete(id: string) {
    const opId = `${this.userId}:delete:${id}`;
    try {
      const op = await this.local.getOperation(opId); if (!op) return;
      let paths = op.payload as { epub_storage_path: string; cover_storage_path: string | null } | undefined;
      if (!paths?.epub_storage_path) { paths = await this.cloud.getStoragePaths(id); await this.local.queueOperation({ ...op, payload: paths, updatedAt: now() }); }
      await this.cloud.deleteBook(id, paths); await this.local.deleteOperation(opId);
    } catch { /* Persisted paths make tombstone/storage cleanup safe to retry. */ }
  }
  async migrateLegacyBooks() { for (const book of await this.local.listLegacyBooks()) { const duplicate = navigator.onLine ? await this.cloud.findByHash(book.fingerprint) : undefined; if (duplicate) { const localNewer = book.updatedAt > duplicate.updatedAt; await this.local.rekeyBook(book.id, localNewer ? { ...duplicate, progress: book.progress, currentCfi: book.currentCfi, updatedAt: book.updatedAt, lastOpenedAt: book.lastOpenedAt } : duplicate); if (localNewer) { const position = { bookId: duplicate.id, cfi: book.currentCfi, percentage: book.progress, updatedAt: book.updatedAt }; await this.local.queueOperation(operation(this.userId, "progress", duplicate.id, position)); await this.flushProgress(duplicate.id); } } else { await this.local.adoptLegacyBook(book.id, this.userId); await this.local.queueOperation(operation(this.userId, "upload", book.id)); await this.processUpload(book.id); } } this.notify(); }
  async isMigrationDismissed() { return Boolean((await this.local.getAccountState())?.migrationDismissedAt); }
  async dismissMigration() { const state = await this.local.getAccountState(); await this.local.putAccountState({ userId: this.userId, lastSyncedAt: state?.lastSyncedAt, migrationDismissedAt: now() }); }
  async showMigrationPrompt() { const state = await this.local.getAccountState(); await this.local.putAccountState({ userId: this.userId, lastSyncedAt: state?.lastSyncedAt, migrationDismissedAt: undefined }); }
  async initializePreferences() {
    let local = await this.local.getPreferences();
    if (!local) {
      try {
        const legacy = JSON.parse(localStorage.getItem("miraf-reader-preferences") ?? "null") as { state?: { preferences?: ReaderPreferences } } | null;
        if (legacy?.state?.preferences) { local = { userId: this.userId, preferences: legacy.state.preferences, changedAt: now() }; await this.local.putPreferences(local); await this.local.queueOperation(operation(this.userId, "preferences", undefined, { preferences: local.preferences, changedAt: local.changedAt })); localStorage.removeItem("miraf-reader-preferences"); }
      } catch { localStorage.removeItem("miraf-reader-preferences"); }
    }
    let cloud: Awaited<ReturnType<CloudBookRepository["getPreferences"]>> | undefined;
    if (navigator.onLine) { try { cloud = await this.cloud.getPreferences() ?? undefined; } catch { /* Local preference cache remains usable. */ } }
    if (cloud && (!local || cloud.changed_at > local.changedAt)) {
      const preferences: ReaderPreferences = { theme: cloud.theme as ReaderPreferences["theme"], flow: cloud.flow as ReaderPreferences["flow"], fontFamily: cloud.font_family as ReaderPreferences["fontFamily"], fontSize: cloud.font_size, lineHeight: cloud.line_height, contentWidth: cloud.content_width as ReaderPreferences["contentWidth"] };
      await this.local.putPreferences({ userId: this.userId, preferences, changedAt: cloud.changed_at }); return preferences;
    }
    const preferences = local?.preferences ?? defaultPreferences;
    if (!local) { const changedAt = now(); await this.local.putPreferences({ userId: this.userId, preferences, changedAt }); await this.local.queueOperation(operation(this.userId, "preferences", undefined, { preferences, changedAt })); }
    else if (!cloud || local.changedAt > cloud.changed_at) await this.local.queueOperation(operation(this.userId, "preferences", undefined, { preferences: local.preferences, changedAt: local.changedAt }));
    if (navigator.onLine) void this.flushPreferences();
    return preferences;
  }
  async savePreferences(preferences: ReaderPreferences) {
    const changedAt = now(); await this.local.putPreferences({ userId: this.userId, preferences, changedAt });
    await this.local.queueOperation(operation(this.userId, "preferences", undefined, { preferences, changedAt }));
    if (this.preferenceTimer) clearTimeout(this.preferenceTimer);
    this.preferenceTimer = setTimeout(() => void this.flushPreferences(), 2_000);
  }
  async flushPreferences() {
    const op = await this.local.getOperation(`${this.userId}:preferences:account`); if (!op || !navigator.onLine) return;
    const payload = op.payload as { preferences: ReaderPreferences; changedAt: string };
    try { await this.cloud.savePreferences(payload.preferences, payload.changedAt); await this.local.deleteOperation(op.id); } catch { /* Retry on next sync trigger. */ }
  }
  retryBook(id: string) { return this.processUpload(id); }
}
export const LIBRARY_CHANGED_EVENT = EVENT;
