"use client";

import Link from "next/link";
import { DotsThreeIcon, TrashIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { BookCover } from "@/components/library/book-cover";
import { ReadingProgress } from "@/components/library/reading-progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatRelativeDate } from "@/lib/format";
import type { BookRecord } from "@/types/book";

export function BookRow({ book, onDelete }: { book: BookRecord; onDelete: (id: string) => Promise<void> }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <article className="library-book-row group grid grid-cols-[64px_minmax(0,1fr)_44px] items-center gap-4 border-t py-4 sm:grid-cols-[74px_minmax(220px,1.5fr)_minmax(160px,1fr)_150px_44px] sm:gap-5">
      <Link href={`/read/${book.id}`} className="rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"><BookCover bookId={book.id} title={book.metadata.title} hasCover={book.hasCover} className="w-14 sm:w-16" /></Link>
      <div className="min-w-0"><Link href={`/read/${book.id}`} className="line-clamp-2 font-heading text-xl leading-tight hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">{book.metadata.title}</Link><p className="mt-1 truncate text-sm text-muted-foreground">{book.metadata.author ?? "Unknown author"}</p><ReadingProgress value={book.progress} className="mt-3 sm:hidden" /></div>
      <ReadingProgress value={book.progress} className="hidden sm:flex" />
      <p className="hidden text-sm text-muted-foreground sm:block">{formatRelativeDate(book.lastOpenedAt)}</p>
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full" aria-label={`Actions for ${book.metadata.title}`}><DotsThreeIcon className="size-5" weight="bold" aria-hidden /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem variant="destructive" onSelect={() => setConfirmOpen(true)}><TrashIcon aria-hidden /> Delete book</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this book?</AlertDialogTitle><AlertDialogDescription>“{book.metadata.title}” and its reading position will be removed from this browser.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep book</AlertDialogCancel><AlertDialogAction variant="destructive" disabled={deleting} onClick={async () => { setDeleting(true); await onDelete(book.id); }}>{deleting ? "Deleting…" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </article>
  );
}
