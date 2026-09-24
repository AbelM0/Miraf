import type { BookRepository } from "@/lib/persistence/book-repository";
import { getMirafDatabase } from "@/lib/persistence/miraf-db";
import type {
  BookId,
  ImportedBook,
  ReadingPosition,
} from "@/types/book";

export class IndexedDbBookRepository implements BookRepository {
  async listBooks() {
    const database = await getMirafDatabase();
    const books = await database.getAll("books");
    return books.sort((left, right) => {
      const leftDate = left.lastOpenedAt ?? left.addedAt;
      const rightDate = right.lastOpenedAt ?? right.addedAt;
      return rightDate.localeCompare(leftDate);
    });
  }

  async getBook(id: BookId) {
    return (await getMirafDatabase()).get("books", id);
  }

  async getBookFile(id: BookId) {
    return (await (await getMirafDatabase()).get("bookFiles", id))?.blob;
  }

  async getBookCover(id: BookId) {
    return (await (await getMirafDatabase()).get("bookCovers", id))?.blob;
  }

  async findByFingerprint(fingerprint: string) {
    return (await getMirafDatabase()).getFromIndex(
      "books",
      "by-fingerprint",
      fingerprint,
    );
  }

  async saveImportedBook(imported: ImportedBook) {
    const database = await getMirafDatabase();
    const transaction = database.transaction(
      ["books", "bookFiles", "bookCovers"],
      "readwrite",
    );
    await Promise.all([
      transaction.objectStore("books").put(imported.book),
      transaction.objectStore("bookFiles").put({
        bookId: imported.book.id,
        blob: imported.file,
      }),
      imported.cover
        ? transaction.objectStore("bookCovers").put({
            bookId: imported.book.id,
            blob: imported.cover,
          })
        : Promise.resolve(),
    ]);
    await transaction.done;
  }

  async savePosition(position: ReadingPosition) {
    const database = await getMirafDatabase();
    const transaction = database.transaction(
      ["books", "readingPositions"],
      "readwrite",
    );
    const book = await transaction.objectStore("books").get(position.bookId);
    if (!book) {
      transaction.abort();
      throw new Error("This book is no longer in your local library.");
    }
    await Promise.all([
      transaction.objectStore("readingPositions").put(position),
      transaction.objectStore("books").put({
        ...book,
        currentCfi: position.cfi,
        progress: position.percentage,
        updatedAt: position.updatedAt,
        lastOpenedAt: position.updatedAt,
      }),
    ]);
    await transaction.done;
  }

  async markOpened(id: BookId, openedAt: string) {
    const database = await getMirafDatabase();
    const book = await database.get("books", id);
    if (book) {
      await database.put("books", {
        ...book,
        lastOpenedAt: openedAt,
        updatedAt: openedAt,
      });
    }
  }

  async deleteBook(id: BookId) {
    const database = await getMirafDatabase();
    const transaction = database.transaction(
      ["books", "bookFiles", "bookCovers", "readingPositions"],
      "readwrite",
    );
    await Promise.all([
      transaction.objectStore("books").delete(id),
      transaction.objectStore("bookFiles").delete(id),
      transaction.objectStore("bookCovers").delete(id),
      transaction.objectStore("readingPositions").delete(id),
    ]);
    await transaction.done;
  }
}

export const bookRepository: BookRepository = new IndexedDbBookRepository();
