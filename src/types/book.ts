export type BookId = string;

export type BookMetadata = {
  title: string;
  author?: string;
  publisher?: string;
  language?: string;
  description?: string;
  identifier?: string;
};

export type BookRecord = {
  id: BookId;
  metadata: BookMetadata;
  fileName: string;
  fileSize: number;
  fingerprint: string;
  hasCover: boolean;
  progress: number;
  currentCfi?: string;
  addedAt: string;
  lastOpenedAt?: string;
  updatedAt: string;
};

export type StoredBookFile = {
  bookId: BookId;
  blob: Blob;
};

export type StoredBookCover = {
  bookId: BookId;
  blob: Blob;
};

export type ReadingPosition = {
  bookId: BookId;
  cfi?: string;
  percentage: number;
  updatedAt: string;
};

export type ImportedBook = {
  book: BookRecord;
  file: Blob;
  cover?: Blob;
};

