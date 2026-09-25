"use client";

import {
  ArrowClockwiseIcon,
  CloudSlashIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { AccountMenu } from "@/components/auth/account-menu";
import { Wordmark } from "@/components/brand/wordmark";
import { AddBookButton } from "@/components/library/add-book-button";
import { BookRow } from "@/components/library/book-row";
import { ContinueReading } from "@/components/library/continue-reading";
import { LibraryEmptyState } from "@/components/library/library-empty-state";
import { LibrarySkeleton } from "@/components/library/library-skeleton";
import { MigrationCallout } from "@/components/library/migration-callout";
import {
  useLibraryService,
  useLibrarySyncStatus,
} from "@/components/library/library-provider";
import { Button } from "@/components/ui/button";
import { EpubImportError } from "@/lib/epub/errors";
import { LIBRARY_CHANGED_EVENT } from "@/lib/services/library-service";
import type { BookRecord } from "@/types/book";

export function LibraryScreen() {
  const libraryService = useLibraryService();
  const { status: syncStatus, retry: retrySync } = useLibrarySyncStatus();
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [legacyBooks, setLegacyBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationVisible, setMigrationVisible] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const loadBooks = useCallback(async () => {
    try {
      const [owned, legacy] = await Promise.all([
        libraryService.listBooks(),
        libraryService.listLegacyBooks(),
      ]);
      setBooks(owned);
      setLegacyBooks(legacy);
      setLoadError(undefined);
    } catch {
      setLoadError("Miraf could not open the cached library in this browser.");
    } finally {
      setLoading(false);
    }
  }, [libraryService]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => void loadBooks(), 0);
    const onBlocked = () =>
      toast.error("Close other Miraf tabs, then try again.");
    const onChanged = () => void loadBooks();
    window.addEventListener("miraf:database-blocked", onBlocked);
    window.addEventListener(LIBRARY_CHANGED_EVENT, onChanged);
    return () => {
      window.clearTimeout(loadTimer);
      window.removeEventListener("miraf:database-blocked", onBlocked);
      window.removeEventListener(LIBRARY_CHANGED_EVENT, onChanged);
    };
  }, [loadBooks]);

  useEffect(() => {
    void libraryService
      .isMigrationDismissed()
      .then((dismissed) => setMigrationVisible(!dismissed));
  }, [libraryService]);

  const handleImport = async (file: File) => {
    setImporting(true);
    const toastId = toast.loading(`Adding ${file.name}…`);
    try {
      const book = await libraryService.importBook(file);
      await loadBooks();
      toast.success(
        `“${book.metadata.title}” is in your library and syncing now.`,
        { id: toastId },
      );
    } catch (error) {
      toast.error(
        error instanceof EpubImportError
          ? error.message
          : "Miraf could not save this book. Check browser storage and try again.",
        { id: toastId },
      );
    } finally {
      setImporting(false);
    }
  };
  const handleDelete = async (id: string) => {
    try {
      await libraryService.deleteBook(id);
      await loadBooks();
      toast.success(
        syncStatus === "offline"
          ? "Book removed here. Cloud deletion will finish when you reconnect."
          : "Book removed from your Miraf library.",
      );
    } catch {
      toast.error("Miraf could not delete that book. Try again.");
    }
  };
  const handleMigration = async () => {
    setMigrating(true);
    const id = toast.loading("Syncing books from this browser…");
    try {
      await libraryService.migrateLegacyBooks();
      await loadBooks();
      toast.success("Your browser books are now part of your Miraf library.", {
        id,
      });
    } catch {
      toast.error(
        "Some books could not be synced. Your local copies are still safe.",
        { id },
      );
    } finally {
      setMigrating(false);
    }
  };
  const allBooks = [...books, ...legacyBooks];
  const latestBook = allBooks.find((book) => book.lastOpenedAt) ?? allBooks[0];
  const waitingForCloud =
    loading || (allBooks.length === 0 && syncStatus === "syncing");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          <Wordmark />
          <div className="flex items-center gap-2">
            {syncStatus === "offline" && (
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <CloudSlashIcon aria-hidden /> Offline
              </span>
            )}
            {syncStatus === "error" && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground"
                onClick={() => void retrySync()}
              >
                <ArrowClockwiseIcon size={15} aria-hidden />
                <span className="hidden sm:inline">Retry sync</span>
              </Button>
            )}
            <AddBookButton onFile={handleImport} disabled={importing} />
            <AccountMenu
              hasLegacyBooks={legacyBooks.length > 0}
              onShowMigration={() => {
                void libraryService.showMigrationPrompt();
                setMigrationVisible(true);
              }}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        <div className="mb-12 flex items-end justify-between gap-6">
          <div>
            <h1 className="font-heading text-5xl leading-none tracking-[-0.04em] sm:text-6xl lg:text-7xl">
              Your library
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg">
              Your books and reading place, ready on every device.
            </p>
          </div>
          <p className="hidden max-w-[19rem] text-right font-heading text-lg italic leading-7 text-muted-foreground lg:block">
            Open a book here. Continue from the same chapter elsewhere.
          </p>
        </div>
        {migrationVisible && legacyBooks.length > 0 && (
          <MigrationCallout
            count={legacyBooks.length}
            syncing={migrating}
            onSync={() => void handleMigration()}
            onDismiss={() => {
              void libraryService.dismissMigration();
              setMigrationVisible(false);
            }}
          />
        )}
        {waitingForCloud ? (
          <LibrarySkeleton />
        ) : loadError ? (
          <section className="flex min-h-[42vh] flex-col items-center justify-center border-y text-center">
            <WarningCircleIcon
              className="mb-4 size-8 text-destructive"
              aria-hidden
            />
            <h2 className="font-heading text-2xl">
              The cached library did not open
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">{loadError}</p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => void loadBooks()}
            >
              Try again
            </Button>
          </section>
        ) : syncStatus === "error" && allBooks.length === 0 ? (
          <section className="flex min-h-[42vh] flex-col items-center justify-center border-y text-center">
            <WarningCircleIcon
              className="mb-4 size-8 text-muted-foreground"
              aria-hidden
            />
            <h2 className="font-heading text-2xl">
              Cloud library unavailable
            </h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Miraf could not reach your library. Cached books are still safe on this device.
            </p>
            <Button className="mt-6 gap-2" onClick={() => void retrySync()}>
              <ArrowClockwiseIcon size={16} aria-hidden />
              Retry sync
            </Button>
          </section>
        ) : allBooks.length === 0 ? (
          <LibraryEmptyState onFile={handleImport} importing={importing} />
        ) : (
          <>
            {latestBook && <ContinueReading book={latestBook} />}
            <section aria-labelledby="all-books-heading">
              <div className="mb-5">
                <h2
                  id="all-books-heading"
                  className="font-heading text-3xl tracking-tight"
                >
                  All books
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {allBooks.length} {allBooks.length === 1 ? "book" : "books"}{" "}
                  in your library
                </p>
              </div>
              <div className="hidden grid-cols-[74px_minmax(220px,1.5fr)_minmax(160px,1fr)_150px_44px] gap-5 border-t py-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground sm:grid">
                <span aria-hidden />
                <span>Title</span>
                <span>Progress</span>
                <span>Last opened</span>
                <span aria-hidden />
              </div>
              {allBooks.map((book) => (
                <BookRow
                  key={book.id}
                  book={book}
                  onDelete={handleDelete}
                  onRetry={(id) => libraryService.retryBook(id)}
                />
              ))}
            </section>
          </>
        )}
      </main>
      <footer className="mx-auto flex w-full max-w-[1440px] items-center justify-between border-t px-5 py-7 text-sm text-muted-foreground sm:px-8 lg:px-12">
        <span>Miraf · ምዕራፍ</span>
        <span>
          {syncStatus === "offline"
            ? "Reading from this browser"
            : "Private cloud EPUB reading"}
        </span>
      </footer>
    </div>
  );
}
