import { beforeAll, describe, expect, it } from "vitest";

import { IndexedDbBookRepository } from "@/lib/persistence/indexeddb-book-repository";
import { getMirafDatabase } from "@/lib/persistence/miraf-db";
import type { ImportedBook } from "@/types/book";

describe("IndexedDbBookRepository", () => {
  const repository = new IndexedDbBookRepository();
  const imported: ImportedBook = {
    book: {
      id: "test-book",
      metadata: { title: "A Test Chapter", author: "Miraf Reader" },
      fileName: "test.epub",
      fileSize: 4,
      fingerprint: "test-fingerprint",
      hasCover: true,
      progress: 0,
      addedAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
    file: new Blob(["epub"], { type: "application/epub+zip" }),
    cover: new Blob(["cover"], { type: "image/png" }),
  };

  beforeAll(async () => {
    const database = await getMirafDatabase();
    const transaction = database.transaction(
      ["books", "bookFiles", "bookCovers", "readingPositions"],
      "readwrite",
    );
    await Promise.all(Array.from(transaction.objectStoreNames).map((name) => transaction.objectStore(name).clear()));
    await transaction.done;
  });

  it("stores file data separately and keeps progress with metadata", async () => {
    await repository.saveImportedBook(imported);

    expect((await repository.getBook("test-book"))?.metadata.title).toBe("A Test Chapter");
    expect(await repository.getBookFile("test-book")).toBeDefined();
    expect(await repository.getBookCover("test-book")).toBeDefined();
    expect((await repository.findByFingerprint("test-fingerprint"))?.id).toBe("test-book");

    await repository.savePosition({
      bookId: "test-book",
      cfi: "epubcfi(/6/2)",
      percentage: 42,
      updatedAt: "2026-01-02T00:00:00.000Z",
    });
    const updated = await repository.getBook("test-book");
    expect(updated).toMatchObject({ progress: 42, currentCfi: "epubcfi(/6/2)" });

    await repository.markOpened("test-book", "2026-01-03T00:00:00.000Z");
    expect(await repository.getBook("test-book")).toMatchObject({
      progress: 42,
      updatedAt: "2026-01-02T00:00:00.000Z",
      lastOpenedAt: "2026-01-03T00:00:00.000Z",
    });

    await repository.deleteBook("test-book");
    expect(await repository.getBook("test-book")).toBeUndefined();
    expect(await repository.getBookFile("test-book")).toBeUndefined();
  });

  it("scopes identical fingerprints to separate accounts", async () => {
    const first = new IndexedDbBookRepository("11111111-1111-1111-1111-111111111111");
    const second = new IndexedDbBookRepository("22222222-2222-2222-2222-222222222222");
    await first.saveImportedBook({ ...imported, book: { ...imported.book, id: "account-one-book", fingerprint: "shared-fingerprint" } });
    await second.saveImportedBook({ ...imported, book: { ...imported.book, id: "account-two-book", fingerprint: "shared-fingerprint" } });

    expect((await first.listBooks()).map((book) => book.id)).toEqual(["account-one-book"]);
    expect((await second.listBooks()).map((book) => book.id)).toEqual(["account-two-book"]);
    expect(await first.getBook("account-two-book")).toBeUndefined();
    expect(await second.getBookFile("account-one-book")).toBeUndefined();
  });
});
