import Link from "next/link";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import { BookCover } from "@/components/library/book-cover";
import { ReadingProgress } from "@/components/library/reading-progress";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/format";
import type { BookRecord } from "@/types/book";

export function ContinueReading({ book }: { book: BookRecord }) {
  const hasStarted = Boolean(book.lastOpenedAt || book.currentCfi || book.progress > 0);
  const actionLabel = hasStarted ? "Continue" : "Start reading";
  return (
    <section aria-labelledby="continue-reading-heading" className="mb-14">
      <h2 id="continue-reading-heading" className="mb-4 font-heading text-2xl tracking-tight">{hasStarted ? "Continue reading" : "Start reading"}</h2>
      <div className="grid grid-cols-[78px_minmax(0,1fr)] overflow-hidden rounded-[14px] border bg-card sm:grid-cols-[132px_1fr] lg:grid-cols-[132px_1fr_240px]">
        <BookCover bookId={book.id} title={book.metadata.title} hasCover={book.hasCover} priority className="m-4 w-[54px] sm:m-5 sm:w-[92px] lg:w-[102px]" />
        <div className="flex min-w-0 flex-col justify-center py-5 pr-4 sm:py-7 sm:pr-5 lg:py-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{formatRelativeDate(book.lastOpenedAt)}</p>
          <h3 className="line-clamp-2 font-heading text-3xl leading-tight tracking-[-0.025em] sm:text-4xl">{book.metadata.title}</h3>
          <p className="mt-1 text-base text-muted-foreground">{book.metadata.author ?? "Unknown author"}</p>
          <ReadingProgress value={book.progress} className="mt-6 max-w-md" />
        </div>
        <div className="col-span-2 flex items-center border-t px-5 py-5 lg:col-span-1 lg:border-t-0 lg:border-l lg:px-8">
          <Button asChild className="h-11 w-full rounded-[10px] sm:w-auto lg:w-full"><Link href={`/read/${book.id}`}>{actionLabel}<ArrowRightIcon aria-hidden /></Link></Button>
        </div>
      </div>
    </section>
  );
}
