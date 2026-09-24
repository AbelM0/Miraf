import { importEpub } from "@/lib/epub/import-book";
import { bookRepository } from "@/lib/persistence/indexeddb-book-repository";

export const libraryService = {
  listBooks: () => bookRepository.listBooks(),
  getBook: (id: string) => bookRepository.getBook(id),
  getBookFile: (id: string) => bookRepository.getBookFile(id),
  getBookCover: (id: string) => bookRepository.getBookCover(id),
  async importBook(file: File) {
    const imported = await importEpub(file, bookRepository);
    await bookRepository.saveImportedBook(imported);
    return imported.book;
  },
  deleteBook: (id: string) => bookRepository.deleteBook(id),
  markOpened: (id: string) => bookRepository.markOpened(id, new Date().toISOString()),
  savePosition(bookId: string, cfi: string | undefined, percentage: number) {
    return bookRepository.savePosition({
      bookId,
      cfi,
      percentage,
      updatedAt: new Date().toISOString(),
    });
  },
};

