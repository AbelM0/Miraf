import type {
  BookId,
  BookRecord,
  ImportedBook,
  ReadingPosition,
} from "@/types/book";

export interface BookRepository {
  listBooks(): Promise<BookRecord[]>;
  getBook(id: BookId): Promise<BookRecord | undefined>;
  getBookFile(id: BookId): Promise<Blob | undefined>;
  getBookCover(id: BookId): Promise<Blob | undefined>;
  findByFingerprint(fingerprint: string): Promise<BookRecord | undefined>;
  saveImportedBook(imported: ImportedBook): Promise<void>;
  savePosition(position: ReadingPosition): Promise<void>;
  markOpened(id: BookId, openedAt: string): Promise<void>;
  deleteBook(id: BookId): Promise<void>;
}

