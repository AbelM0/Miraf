import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { BookRecord, ReadingPosition, StoredBookCover, StoredBookFile } from "@/types/book";
import type { AccountState, StoredReaderPreferences, SyncOperation } from "@/types/sync";

export interface MirafSchema extends DBSchema {
  books: {
    key: string; value: BookRecord;
    indexes: { "by-added": string; "by-last-opened": string; "by-fingerprint": string; "by-owner": string; "by-owner-fingerprint": [string, string] };
  };
  bookFiles: { key: string; value: StoredBookFile };
  bookCovers: { key: string; value: StoredBookCover };
  readingPositions: { key: string; value: ReadingPosition };
  syncOperations: { key: string; value: SyncOperation; indexes: { "by-user": string; "by-user-kind": [string, string] } };
  accountState: { key: string; value: AccountState };
  readerPreferences: { key: string; value: StoredReaderPreferences };
}

let databasePromise: Promise<IDBPDatabase<MirafSchema>> | undefined;

export function getMirafDatabase() {
  if (typeof window === "undefined") throw new Error("Miraf's local library is only available in the browser.");
  databasePromise ??= openDB<MirafSchema>("miraf-library", 2, {
    upgrade(database, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const books = database.createObjectStore("books", { keyPath: "id" });
        books.createIndex("by-added", "addedAt");
        books.createIndex("by-last-opened", "lastOpenedAt");
        books.createIndex("by-fingerprint", "fingerprint");
        database.createObjectStore("bookFiles", { keyPath: "bookId" });
        database.createObjectStore("bookCovers", { keyPath: "bookId" });
        database.createObjectStore("readingPositions", { keyPath: "bookId" });
      }
      if (oldVersion < 2) {
        const books = transaction.objectStore("books");
        if (books.indexNames.contains("by-fingerprint")) books.deleteIndex("by-fingerprint");
        books.createIndex("by-fingerprint", "fingerprint");
        books.createIndex("by-owner", "ownerUserId");
        books.createIndex("by-owner-fingerprint", ["ownerUserId", "fingerprint"], { unique: true });
        const operations = database.createObjectStore("syncOperations", { keyPath: "id" });
        operations.createIndex("by-user", "userId");
        operations.createIndex("by-user-kind", ["userId", "kind"]);
        database.createObjectStore("accountState", { keyPath: "userId" });
        database.createObjectStore("readerPreferences", { keyPath: "userId" });
      }
    },
    blocked() { window.dispatchEvent(new CustomEvent("miraf:database-blocked")); },
  });
  return databasePromise;
}

