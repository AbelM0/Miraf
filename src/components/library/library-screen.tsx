"use client";

import { WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Wordmark } from "@/components/brand/wordmark";
import { AddBookButton } from "@/components/library/add-book-button";
import { BookRow } from "@/components/library/book-row";
import { ContinueReading } from "@/components/library/continue-reading";
import { LibraryEmptyState } from "@/components/library/library-empty-state";
import { LibrarySkeleton } from "@/components/library/library-skeleton";
import { Button } from "@/components/ui/button";
import { EpubImportError } from "@/lib/epub/errors";
import { libraryService } from "@/lib/services/library-service";
import type { BookRecord } from "@/types/book";

export function LibraryScreen() {
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const loadBooks = useCallback(async () => { try { setBooks(await libraryService.listBooks()); setLoadError(undefined); } catch { setLoadError("Miraf could not open the local library in this browser."); } finally { setLoading(false); } }, []);
  useEffect(() => { const loadTimer = window.setTimeout(() => void loadBooks(), 0); const onBlocked = () => toast.error("Close other Miraf tabs, then try again."); window.addEventListener("miraf:database-blocked", onBlocked); return () => { window.clearTimeout(loadTimer); window.removeEventListener("miraf:database-blocked", onBlocked); }; }, [loadBooks]);
  const handleImport = async (file: File) => {
    setImporting(true); const toastId = toast.loading(`Adding ${file.name}…`);
    try { const book = await libraryService.importBook(file); await loadBooks(); toast.success(`“${book.metadata.title}” was added to your library.`, { id: toastId }); }
    catch (error) { toast.error(error instanceof EpubImportError ? error.message : "Miraf could not save this book. Check browser storage and try again.", { id: toastId }); }
    finally { setImporting(false); }
  };
  const handleDelete = async (id: string) => { try { await libraryService.deleteBook(id); setBooks((current) => current.filter((book) => book.id !== id)); toast.success("Book removed from this browser."); } catch { toast.error("Miraf could not delete that book."); } };
  const latestBook = books.find((book) => book.lastOpenedAt) ?? books[0];
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95"><div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12"><Wordmark /><AddBookButton onFile={handleImport} disabled={importing} /></div></header>
      <main className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mb-12 flex items-end justify-between gap-6"><div><h1 className="font-heading text-5xl leading-none tracking-[-0.045em] sm:text-6xl lg:text-7xl">Your library</h1><p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">A quiet place for the books you are reading now.</p></div><p className="hidden max-w-[19rem] text-right font-heading text-lg italic leading-7 text-muted-foreground lg:block">Your books stay here, ready when you return.</p></div>
        {loading ? <LibrarySkeleton /> : loadError ? <section className="flex min-h-[42vh] flex-col items-center justify-center border-y text-center"><WarningCircleIcon className="mb-4 size-8 text-destructive" aria-hidden /><h2 className="font-heading text-2xl">The local library did not open</h2><p className="mt-2 max-w-md text-muted-foreground">{loadError}</p><Button variant="outline" className="mt-6" onClick={() => void loadBooks()}>Try again</Button></section> : books.length === 0 ? <LibraryEmptyState onFile={handleImport} importing={importing} /> : <>{latestBook && <ContinueReading book={latestBook} />}<section aria-labelledby="all-books-heading"><div className="mb-5"><h2 id="all-books-heading" className="font-heading text-3xl tracking-tight">All books</h2><p className="mt-1 text-sm text-muted-foreground">{books.length} {books.length === 1 ? "book" : "books"} stored in this browser</p></div><div className="hidden grid-cols-[74px_minmax(220px,1.5fr)_minmax(160px,1fr)_150px_44px] gap-5 border-t py-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground sm:grid"><span aria-hidden /><span>Title</span><span>Progress</span><span>Last opened</span><span aria-hidden /></div>{books.map((book) => <BookRow key={book.id} book={book} onDelete={handleDelete} />)}</section></>}
      </main>
      <footer className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-t px-5 py-7 text-sm text-muted-foreground sm:px-8 lg:px-12"><span>Miraf · ምዕራፍ</span><span>Local-first EPUB reading</span></footer>
    </div>
  );
}
