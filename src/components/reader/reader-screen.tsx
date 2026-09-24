"use client";

import { useRouter } from "next/navigation";
import { CaretLeftIcon, CaretRightIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type EpubBook from "epubjs/types/book";
import type { Location, RenditionOptions } from "epubjs/types/rendition";
import type Rendition from "epubjs/types/rendition";
import { ReaderSettings } from "@/components/reader/reader-settings";
import { ReaderToolbar } from "@/components/reader/reader-toolbar";
import { TableOfContents } from "@/components/reader/table-of-contents";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { libraryService } from "@/lib/services/library-service";
import { cn } from "@/lib/utils";
import { useReaderStore } from "@/stores/reader-store";
import type { BookRecord } from "@/types/book";
import type { TocItem } from "@/types/reader";

const widthValues = { narrow: "38rem", standard: "46rem", wide: "58rem" } as const;
const readerThemes = {
  light: { body: { color: "#292c29 !important", background: "#fffdf8 !important" }, a: { color: "#173f36 !important" } },
  sepia: { body: { color: "#3d3429 !important", background: "#f2e7cf !important" }, a: { color: "#604c32 !important" } },
  dark: { body: { color: "#e9e5dc !important", background: "#1d2421 !important" }, a: { color: "#b9d2c9 !important" } },
};

export function ReaderScreen({ bookId }: { bookId: string }) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const epubBookRef = useRef<EpubBook | undefined>(undefined);
  const renditionRef = useRef<Rendition | undefined>(undefined);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const touchStartRef = useRef<number | undefined>(undefined);
  const [book, setBook] = useState<BookRecord>();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const preferences = useReaderStore((state) => state.preferences);
  const flow = preferences.flow;

  const previous = useCallback(() => { void renditionRef.current?.prev(); }, []);
  const next = useCallback(() => { void renditionRef.current?.next(); }, []);
  const display = useCallback((href: string) => { void renditionRef.current?.display(href).catch(() => toast.error("That section could not be opened.")); }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, [contenteditable=true]")) return;
      if (flow === "paginated" && event.key === "ArrowLeft") { event.preventDefault(); previous(); }
      if (flow === "paginated" && event.key === "ArrowRight") { event.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flow, next, previous]);

  useEffect(() => {
    let cancelled = false;
    const container = viewportRef.current;
    if (!container) return;
    container.replaceChildren();

    const start = async () => {
      try {
        const [record, file] = await Promise.all([libraryService.getBook(bookId), libraryService.getBookFile(bookId)]);
        setLoading(true);
        setError(undefined);
        if (!record || !file) throw new Error("missing");
        if (cancelled) return;
        setBook(record);
        setProgress(record.progress);
        await libraryService.markOpened(bookId);

        const { default: ePub } = await import("epubjs");
        const epubBook = ePub(await file.arrayBuffer()) as EpubBook;
        epubBookRef.current = epubBook;
        await epubBook.ready;
        if (cancelled) return;
        setToc(epubBook.navigation.toc as TocItem[]);

        const options: RenditionOptions = {
          width: "100%",
          height: "100%",
          manager: flow === "scrolled" ? "continuous" : "default",
          flow: flow === "scrolled" ? "scrolled-doc" : "paginated",
          spread: "none",
          allowScriptedContent: false,
          resizeOnOrientationChange: true,
        };
        const rendition = epubBook.renderTo(container, options);
        renditionRef.current = rendition;
        rendition.themes.register(readerThemes);
        const currentPreferences = useReaderStore.getState().preferences;
        rendition.themes.select(currentPreferences.theme);
        rendition.themes.font(currentPreferences.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif");
        rendition.themes.fontSize(`${currentPreferences.fontSize}px`);
        rendition.themes.override("line-height", String(currentPreferences.lineHeight), true);
        rendition.themes.override("max-width", widthValues[currentPreferences.contentWidth], true);
        rendition.themes.override("margin-left", "auto", true);
        rendition.themes.override("margin-right", "auto", true);
        rendition.hooks.content.register((contents: { document: Document }) => {
          contents.document.querySelectorAll("script, iframe, object, embed").forEach((node) => node.remove());
          contents.document.querySelectorAll<HTMLElement>("[src]").forEach((node) => {
            const source = node.getAttribute("src");
            if (source && /^https?:/i.test(source)) node.removeAttribute("src");
          });
          contents.document.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
            const href = anchor.getAttribute("href");
            if (href && /^(javascript|data):/i.test(href.trim())) anchor.removeAttribute("href");
          });
        });

        const onRelocated = (location: Location) => {
          const cfi = location.start.cfi;
          let percentage = location.start.percentage;
          if (!Number.isFinite(percentage) && epubBook.locations.length() > 0) percentage = epubBook.locations.percentageFromCfi(cfi);
          const normalized = Math.max(0, Math.min(100, (percentage || 0) * 100));
          setProgress(normalized);
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          saveTimerRef.current = setTimeout(() => { void libraryService.savePosition(bookId, cfi, normalized).catch(() => toast.error("Reading position could not be saved.")); }, 700);
        };
        rendition.on("relocated", onRelocated);
        await rendition.display(record.currentCfi).catch(() => rendition.display());
        setLoading(false);
        void epubBook.locations.generate(1500).then(() => rendition.reportLocation()).catch(() => undefined);

        const resizeObserver = new ResizeObserver(() => {
          const rect = container.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) rendition.resize(rect.width, rect.height);
        });
        resizeObserver.observe(container);
        return () => { resizeObserver.disconnect(); rendition.off("relocated", onRelocated); };
      } catch {
        if (!cancelled) { setError("This book is missing or could not be rendered in this browser."); setLoading(false); }
      }
    };

    let stopResize: (() => void) | undefined;
    void start().then((cleanup) => { stopResize = cleanup; });
    return () => {
      cancelled = true;
      stopResize?.();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      renditionRef.current?.destroy();
      epubBookRef.current?.destroy();
      renditionRef.current = undefined;
      epubBookRef.current = undefined;
      container.replaceChildren();
    };
  }, [bookId, flow]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    rendition.themes.select(preferences.theme);
    rendition.themes.font(preferences.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif");
    rendition.themes.fontSize(`${preferences.fontSize}px`);
    rendition.themes.override("line-height", String(preferences.lineHeight), true);
    rendition.themes.override("max-width", widthValues[preferences.contentWidth], true);
    rendition.themes.override("margin-left", "auto", true);
    rendition.themes.override("margin-right", "auto", true);
  }, [preferences]);

  return (
    <div className={cn("reader-shell flex h-dvh flex-col overflow-hidden", `reader-theme-${preferences.theme}`)}>
      {book ? <ReaderToolbar title={book.metadata.title} author={book.metadata.author} progress={progress} /> : <div className="h-[68px] border-b px-5 py-4"><Skeleton className="mx-auto h-8 w-56" /></div>}
      <main className="relative min-h-0 flex-1">
        <div ref={viewportRef} className="absolute inset-y-0 left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 sm:w-[calc(100%-7rem)]" style={{ maxWidth: widthValues[preferences.contentWidth] }} aria-label="EPUB reading area" onPointerDown={(event) => { touchStartRef.current = event.clientX; }} onPointerUp={(event) => { if (flow !== "paginated" || touchStartRef.current === undefined) return; const delta = event.clientX - touchStartRef.current; touchStartRef.current = undefined; if (Math.abs(delta) > 70) { if (delta > 0) previous(); else next(); } }} />
        {loading && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[var(--reader-bg)]"><div className="w-[min(82vw,600px)] space-y-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" /></div></div>}
        {error && <div className="absolute inset-0 grid place-items-center bg-background p-6 text-center"><div><WarningCircleIcon className="mx-auto mb-4 size-9 text-destructive" aria-hidden /><h1 className="font-heading text-3xl">This chapter cannot open</h1><p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">{error}</p><Button className="mt-6 h-11" onClick={() => router.push("/")}>Return to library</Button></div></div>}
        {!error && flow === "paginated" && <><Button variant="ghost" size="icon-lg" className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/70 shadow-sm backdrop-blur-sm sm:inline-flex" onClick={previous} aria-label="Previous page"><CaretLeftIcon aria-hidden /></Button><Button variant="ghost" size="icon-lg" className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-background/70 shadow-sm backdrop-blur-sm sm:inline-flex" onClick={next} aria-label="Next page"><CaretRightIcon aria-hidden /></Button></>}
      </main>
      {!error && <div className="relative z-20 flex h-14 items-center gap-3 border-t px-4 sm:hidden"><Button variant="ghost" className="h-10 flex-1" onClick={previous} disabled={flow === "scrolled"}><CaretLeftIcon aria-hidden /> Previous</Button><Button variant="ghost" className="h-10 flex-1" onClick={next} disabled={flow === "scrolled"}>Next <CaretRightIcon aria-hidden /></Button></div>}
      <div className="relative z-20 h-1 bg-primary/10" role="progressbar" aria-label="Book progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
      <TableOfContents items={toc} onSelect={display} />
      <ReaderSettings />
    </div>
  );
}
