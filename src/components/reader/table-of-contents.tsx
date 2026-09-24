"use client";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useReaderStore } from "@/stores/reader-store";
import type { TocItem } from "@/types/reader";

export function TableOfContents({ items, onSelect }: { items: TocItem[]; onSelect: (href: string) => void }) {
  const { tocOpen, setTocOpen } = useReaderStore();
  return <Sheet open={tocOpen} onOpenChange={setTocOpen}><SheetContent side="left" className="w-[min(92vw,410px)] overflow-y-auto p-0"><SheetHeader className="border-b px-6 py-5"><SheetTitle className="font-heading text-2xl">Contents</SheetTitle><SheetDescription>Jump to a chapter or section.</SheetDescription></SheetHeader><nav aria-label="Book table of contents" className="p-3">{items.length ? <TocList items={items} onSelect={(href) => { onSelect(href); setTocOpen(false); }} /> : <p className="px-3 py-8 text-sm leading-6 text-muted-foreground">This book does not provide a table of contents.</p>}</nav></SheetContent></Sheet>;
}

function TocList({ items, onSelect, nested = false }: { items: TocItem[]; onSelect: (href: string) => void; nested?: boolean }) {
  return <ol className={nested ? "ml-4 border-l pl-3" : undefined}>{items.map((item) => <li key={`${item.id}-${item.href}`}><button type="button" onClick={() => onSelect(item.href)} className="w-full rounded-lg px-3 py-2.5 text-left text-sm leading-5 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">{item.label}</button>{item.subitems?.length ? <TocList items={item.subitems} onSelect={onSelect} nested /> : null}</li>)}</ol>;
}
