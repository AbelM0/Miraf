"use client";
import { ArrowUpIcon, BooksIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

export function MigrationCallout({ count, syncing, onSync, onDismiss }: { count: number; syncing: boolean; onSync: () => void; onDismiss: () => void }) {
  return (
    <section className="mb-12 flex flex-col gap-5 rounded-[14px] bg-muted px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6" aria-labelledby="migration-title">
      <div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-background text-primary"><BooksIcon className="size-5" aria-hidden /></span><div><h2 id="migration-title" className="font-heading text-2xl">Bring this browser’s books with you</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{count} {count === 1 ? "book is" : "books are"} still stored only in this browser. Sync {count === 1 ? "it" : "them"} to your account.</p></div></div>
      <div className="flex shrink-0 gap-2 pl-[60px] sm:pl-0"><Button variant="ghost" onClick={onDismiss} disabled={syncing}>Not now</Button><Button onClick={onSync} disabled={syncing}>{syncing ? "Syncing…" : <><ArrowUpIcon aria-hidden /> Sync all</>}</Button></div>
    </section>
  );
}

