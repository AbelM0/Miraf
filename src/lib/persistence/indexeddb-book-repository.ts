import type { BookRepository } from "@/lib/persistence/book-repository";
import { getMirafDatabase } from "@/lib/persistence/miraf-db";
import type { BookId, BookRecord, ImportedBook, ReadingPosition } from "@/types/book";
import type { AccountState, StoredReaderPreferences, SyncOperation } from "@/types/sync";

export class IndexedDbBookRepository implements BookRepository {
  constructor(private readonly userId?: string) {}
  private canAccess(book: BookRecord | undefined) { return Boolean(book && (book.ownerUserId === this.userId || !book.ownerUserId)); }

  async listBooks() {
    const books = await (await getMirafDatabase()).getAll("books");
    return books.filter((book) => this.userId ? book.ownerUserId === this.userId : !book.ownerUserId)
      .sort((a, b) => (b.lastOpenedAt ?? b.addedAt).localeCompare(a.lastOpenedAt ?? a.addedAt));
  }
  async listLegacyBooks() { return (await (await getMirafDatabase()).getAll("books")).filter((book) => !book.ownerUserId).sort((a, b) => b.addedAt.localeCompare(a.addedAt)); }
  async getBook(id: BookId) { const book = await (await getMirafDatabase()).get("books", id); return this.canAccess(book) ? book : undefined; }
  async getBookFile(id: BookId) { if (!this.canAccess(await (await getMirafDatabase()).get("books", id))) return; return (await (await getMirafDatabase()).get("bookFiles", id))?.blob; }
  async getBookCover(id: BookId) { if (!this.canAccess(await (await getMirafDatabase()).get("books", id))) return; return (await (await getMirafDatabase()).get("bookCovers", id))?.blob; }
  async getPosition(id: BookId) { return (await getMirafDatabase()).get("readingPositions", id); }
  async findByFingerprint(fingerprint: string) {
    const db = await getMirafDatabase();
    if (this.userId) return db.getFromIndex("books", "by-owner-fingerprint", [this.userId, fingerprint]);
    return (await db.getAllFromIndex("books", "by-fingerprint", fingerprint)).find((book) => !book.ownerUserId);
  }
  async saveImportedBook(imported: ImportedBook) {
    const db = await getMirafDatabase(); const tx = db.transaction(["books", "bookFiles", "bookCovers"], "readwrite");
    const book: BookRecord = { ...imported.book, ownerUserId: imported.book.ownerUserId ?? this.userId, cloudState: imported.book.cloudState ?? (this.userId ? "uploading" : "legacy") };
    await Promise.all([
      tx.objectStore("books").put(book), tx.objectStore("bookFiles").put({ bookId: book.id, blob: imported.file }),
      imported.cover ? tx.objectStore("bookCovers").put({ bookId: book.id, blob: imported.cover }) : Promise.resolve(),
    ]); await tx.done;
  }
  async putBook(book: BookRecord) { await (await getMirafDatabase()).put("books", book); }
  async cacheBookFile(bookId: string, blob: Blob) { await (await getMirafDatabase()).put("bookFiles", { bookId, blob }); }
  async cacheBookCover(bookId: string, blob: Blob) { await (await getMirafDatabase()).put("bookCovers", { bookId, blob }); }
  async savePosition(position: ReadingPosition) {
    const db = await getMirafDatabase(); const tx = db.transaction(["books", "readingPositions"], "readwrite"); const book = await tx.objectStore("books").get(position.bookId);
    if (!this.canAccess(book)) { tx.abort(); throw new Error("This book is no longer in your library."); }
    await Promise.all([tx.objectStore("readingPositions").put(position), tx.objectStore("books").put({ ...book!, currentCfi: position.cfi, progress: position.percentage, updatedAt: position.updatedAt, lastOpenedAt: position.updatedAt })]); await tx.done;
  }
  async markOpened(id: BookId, openedAt: string) { const db = await getMirafDatabase(); const book = await db.get("books", id); if (this.canAccess(book)) await db.put("books", { ...book!, lastOpenedAt: openedAt }); }
  async deleteBook(id: BookId) {
    const db = await getMirafDatabase(); if (!this.canAccess(await db.get("books", id))) return;
    const tx = db.transaction(["books", "bookFiles", "bookCovers", "readingPositions"], "readwrite");
    await Promise.all([tx.objectStore("books").delete(id), tx.objectStore("bookFiles").delete(id), tx.objectStore("bookCovers").delete(id), tx.objectStore("readingPositions").delete(id)]); await tx.done;
  }
  async queueOperation(value: SyncOperation) { await (await getMirafDatabase()).put("syncOperations", value); }
  async getOperation(id: string) { return (await getMirafDatabase()).get("syncOperations", id); }
  async listOperations() { return this.userId ? (await getMirafDatabase()).getAllFromIndex("syncOperations", "by-user", this.userId) : []; }
  async deleteOperation(id: string) { await (await getMirafDatabase()).delete("syncOperations", id); }
  async getAccountState() { return this.userId ? (await getMirafDatabase()).get("accountState", this.userId) : undefined; }
  async putAccountState(value: AccountState) { await (await getMirafDatabase()).put("accountState", value); }
  async getPreferences() { return this.userId ? (await getMirafDatabase()).get("readerPreferences", this.userId) : undefined; }
  async putPreferences(value: StoredReaderPreferences) { await (await getMirafDatabase()).put("readerPreferences", value); }
  async adoptLegacyBook(id: string, userId: string) { const db = await getMirafDatabase(); const book = await db.get("books", id); if (book && !book.ownerUserId) await db.put("books", { ...book, ownerUserId: userId, cloudState: "uploading", cloudError: undefined }); }
  async rekeyBook(oldId: string, cloudBook: BookRecord) {
    if (oldId === cloudBook.id) return this.putBook(cloudBook);
    const db = await getMirafDatabase(); const tx = db.transaction(["books", "bookFiles", "bookCovers", "readingPositions"], "readwrite");
    const [file, cover, position] = await Promise.all([tx.objectStore("bookFiles").get(oldId), tx.objectStore("bookCovers").get(oldId), tx.objectStore("readingPositions").get(oldId)]);
    await tx.objectStore("books").delete(oldId);
    await tx.objectStore("books").put(cloudBook);
    if (file) await tx.objectStore("bookFiles").put({ bookId: cloudBook.id, blob: file.blob });
    if (cover) await tx.objectStore("bookCovers").put({ bookId: cloudBook.id, blob: cover.blob });
    if (position) await tx.objectStore("readingPositions").put({ ...position, bookId: cloudBook.id });
    await Promise.all([tx.objectStore("bookFiles").delete(oldId), tx.objectStore("bookCovers").delete(oldId), tx.objectStore("readingPositions").delete(oldId)]); await tx.done;
  }
}
