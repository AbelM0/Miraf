import { BookOpenIcon } from "@phosphor-icons/react/dist/ssr";
import { AddBookButton } from "@/components/library/add-book-button";

export function LibraryEmptyState({ onFile, importing }: { onFile: (file: File) => void; importing: boolean }) {
  return <section className="flex min-h-[52vh] flex-col items-center justify-center border-y py-20 text-center"><div className="mb-6 grid size-14 place-items-center rounded-full bg-primary/8 text-primary"><BookOpenIcon className="size-7" weight="light" aria-hidden /></div><h2 className="font-heading text-3xl tracking-tight">Your shelf is ready</h2><p className="mt-3 max-w-md text-balance leading-7 text-muted-foreground">Add a DRM-free EPUB to begin. Your books and reading positions stay in this browser.</p><div className="mt-7"><AddBookButton onFile={onFile} disabled={importing} /></div></section>;
}
