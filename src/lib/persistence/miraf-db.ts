import { openDB, type DBSchema, type IDBPDatabase } from "idb";

import type {
  BookRecord,
  ReadingPosition,
  StoredBookCover,
  StoredBookFile,
} from "@/types/book";

interface MirafSchema extends DBSchema {
  books: {
    key: string;
    value: BookRecord;
    indexes: {
      "by-added": string;
      "by-last-opened": string;
      "by-fingerprint": string;
    };
  };
  bookFiles: {
    key: string;
    value: StoredBookFile;
  };
  bookCovers: {
    key: string;
    value: StoredBookCover;
  };
  readingPositions: {
    key: string;
    value: ReadingPosition;
  };
}

let databasePromise: Promise<IDBPDatabase<MirafSchema>> | undefined;

export function getMirafDatabase() {
  if (typeof window === "undefined") {
    throw new Error("Miraf's local library is only available in the browser.");
  }

  databasePromise ??= openDB<MirafSchema>("miraf-library", 1, {
    upgrade(database) {
      const books = database.createObjectStore("books", { keyPath: "id" });
      books.createIndex("by-added", "addedAt");
      books.createIndex("by-last-opened", "lastOpenedAt");
      books.createIndex("by-fingerprint", "fingerprint", { unique: true });
      database.createObjectStore("bookFiles", { keyPath: "bookId" });
      database.createObjectStore("bookCovers", { keyPath: "bookId" });
      database.createObjectStore("readingPositions", { keyPath: "bookId" });
    },
    blocked() {
      window.dispatchEvent(new CustomEvent("miraf:database-blocked"));
    },
  });

  return databasePromise;
}

