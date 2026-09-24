"use client";

import Link from "next/link";
import { ArrowLeftIcon, ListIcon, TextAaIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useReaderStore } from "@/stores/reader-store";

export function ReaderToolbar({ title, author, progress }: { title: string; author?: string; progress: number }) {
  const { setTocOpen, setSettingsOpen } = useReaderStore();
  return <header className="reader-toolbar relative z-20 grid h-[68px] grid-cols-[80px_minmax(0,1fr)_80px] items-center gap-2 border-b px-3 sm:px-5"><div className="flex"><Button asChild variant="ghost" size="icon-lg" className="rounded-full"><Link href="/" aria-label="Back to library"><ArrowLeftIcon className="size-5" aria-hidden /></Link></Button><Button variant="ghost" size="icon-lg" className="rounded-full" onClick={() => setTocOpen(true)} aria-label="Open table of contents"><ListIcon className="size-5" aria-hidden /></Button></div><div className="min-w-0 text-center"><p className="truncate font-heading text-lg leading-tight">{title}</p><p className="truncate text-[11px] text-muted-foreground">{author ?? "Unknown author"} · {Math.round(progress)}%</p></div><div className="flex justify-end"><Button variant="ghost" size="icon-lg" className="rounded-full" onClick={() => setSettingsOpen(true)} aria-label="Open reading appearance"><TextAaIcon className="size-5" aria-hidden /></Button></div></header>;
}
