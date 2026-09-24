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
import type { ReaderFont, ReaderTheme, ReaderWidth, TocItem } from "@/types/reader";

const widthValues = { narrow: "38rem", standard: "46rem", wide: "58rem" } as const;
const scrolledBodyStyles = {
  "box-sizing": "border-box !important",
  width: "100% !important",
  "margin-left": "auto !important",
  "margin-right": "auto !important",
  "padding-left": "clamp(1rem, 5vw, 3.5rem) !important",
  "padding-right": "clamp(1rem, 5vw, 3.5rem) !important",
};
const themePalette: Record<ReaderTheme, { background: string; color: string; link: string }> = {
  light: { background: "#fffdf8", color: "#292c29", link: "#173f36" },
  sepia: { background: "#f2e7cf", color: "#3d3429", link: "#604c32" },
  dark: { background: "#1d2421", color: "#e9e5dc", link: "#b9d2c9" },
};
const textElements = "p, div, span, li, dt, dd, h1, h2, h3, h4, h5, h6, blockquote, figcaption, td, th";
const readerThemes = {
  light: {
    "body.light": { color: "#292c29 !important", background: "#fffdf8 !important" },
    "body.light.miraf-scrolled": scrolledBodyStyles,
    [`body.light :is(${textElements})`]: { color: "#292c29 !important" },
    "body.light a": { color: "#173f36 !important" },
  },
  sepia: {
    "body.sepia": { color: "#3d3429 !important", background: "#f2e7cf !important" },
    "body.sepia.miraf-scrolled": scrolledBodyStyles,
    [`body.sepia :is(${textElements})`]: { color: "#3d3429 !important" },
    "body.sepia a": { color: "#604c32 !important" },
  },
  dark: {
    "body.dark": { color: "#e9e5dc !important", background: "#1d2421 !important" },
    "body.dark.miraf-scrolled": scrolledBodyStyles,
    [`body.dark :is(${textElements})`]: { color: "#e9e5dc !important" },
    "body.dark a": { color: "#b9d2c9 !important" },
  },
};

function applyReaderTheme(rendition: Rendition, theme: ReaderTheme) {
  const palette = themePalette[theme];
  rendition.themes.select(theme);
  rendition.themes.override("background-color", palette.background, true);
  rendition.themes.override("color", palette.color, true);
}

function applyReaderTypography(rendition: Rendition, fontFamily: ReaderFont, fontSize: number, lineHeight: number, contentWidth: ReaderWidth) {
  rendition.themes.font(fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif");
  rendition.themes.fontSize(`${fontSize}px`);
  rendition.themes.override("line-height", String(lineHeight), true);
  rendition.themes.override("max-width", widthValues[contentWidth], true);
  rendition.themes.override("margin-left", "auto", true);
  rendition.themes.override("margin-right", "auto", true);
}

function applyReaderFlowClass(rendition: Rendition, scrolled: boolean) {
  const contents = rendition.getContents() as unknown as Array<{ document: Document }>;
  contents.forEach(({ document }) => document.body?.classList.toggle("miraf-scrolled", scrolled));
}

async function displayWithTimeout(rendition: Rendition, target: string, timeoutMs = 2500) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const result = await Promise.race([
    rendition.display(target).then(() => true, () => false),
    new Promise<boolean>((resolve) => {
      timeout = setTimeout(() => resolve(false), timeoutMs);
    }),
  ]);
  if (timeout) clearTimeout(timeout);
  return result;
}

function normalizeChapterHref(href: string) {
  const resource = href.split(/[?#]/, 1)[0].replace(/^\.\//, "");
  try {
    return decodeURIComponent(resource);
  } catch {
    return resource;
  }
}

function findCurrentTocId(items: TocItem[], currentHref: string) {
  const flattened: TocItem[] = [];
  const collect = (entries: TocItem[]) => {
    entries.forEach((item) => {
      flattened.push(item);
      if (item.subitems?.length) collect(item.subitems);
    });
  };
  collect(items);

  const exactMatch = flattened.find((item) => item.href === currentHref);
  if (exactMatch) return exactMatch.id;

  const currentChapter = normalizeChapterHref(currentHref);
  return flattened.find((item) => normalizeChapterHref(item.href) === currentChapter)?.id;
}

function alignScrolledTocTarget(container: HTMLElement, sectionIndex: number, href: string) {
  const scrollContainer = container.querySelector<HTMLElement>(".epub-container");
  const view = Array.from(container.querySelectorAll<HTMLElement>(".epub-view"))
    .find((candidate) => candidate.getAttribute("ref") === String(sectionIndex));
  if (!scrollContainer || !view) return false;

  const containerRect = scrollContainer.getBoundingClientRect();
  let targetTop = scrollContainer.scrollTop + view.getBoundingClientRect().top - containerRect.top;
  const fragment = href.split("#", 2)[1];
  const frame = view.querySelector<HTMLIFrameElement>("iframe");

  if (fragment && frame?.contentDocument) {
    let fragmentId = fragment;
    try { fragmentId = decodeURIComponent(fragment); }
    catch { /* Use the EPUB's original fragment when it is not URI encoded correctly. */ }
    const target = frame.contentDocument.getElementById(fragmentId)
      ?? frame.contentDocument.querySelector<HTMLElement>(`[name="${CSS.escape(fragmentId)}"]`);
    if (target) {
      targetTop = scrollContainer.scrollTop
        + frame.getBoundingClientRect().top
        - containerRect.top
        + target.getBoundingClientRect().top;
    }
  }

  scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: "auto" });
  return true;
}

async function settleScrolledTocTarget(container: HTMLElement, sectionIndex: number, href: string, isActive: () => boolean) {
  const stopAt = performance.now() + 350;
  do {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    if (!isActive()) return;
    alignScrolledTocTarget(container, sectionIndex, href);
  } while (performance.now() < stopAt);
}

export function ReaderScreen({ bookId }: { bookId: string }) {
  const router = useRouter();
  const viewportRef = useRef<HTMLDivElement>(null);
  const epubBookRef = useRef<EpubBook | undefined>(undefined);
  const renditionRef = useRef<Rendition | undefined>(undefined);
  const navigationQueueRef = useRef<Promise<void>>(Promise.resolve());
  const readerSessionRef = useRef(0);
  const lastKeyboardNavigationRef = useRef(0);
  const [book, setBook] = useState<BookRecord>();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [currentTocId, setCurrentTocId] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [readerReady, setReaderReady] = useState(false);
  const [error, setError] = useState<string>();
  const preferences = useReaderStore((state) => state.preferences);
  const flow = preferences.flow;

  const navigate = useCallback((direction: "previous" | "next") => {
    const session = readerSessionRef.current;
    navigationQueueRef.current = navigationQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        if (session !== readerSessionRef.current) return;
        const rendition = renditionRef.current;
        if (!rendition || useReaderStore.getState().preferences.flow !== "paginated") return;
        await (direction === "previous" ? rendition.prev() : rendition.next());
      })
      .catch(() => {
        if (session === readerSessionRef.current) toast.error("That page could not be opened.");
      });
  }, []);
  const previous = useCallback(() => navigate("previous"), [navigate]);
  const next = useCallback(() => navigate("next"), [navigate]);
  const navigateWithKeyboard = useCallback((direction: "previous" | "next") => {
    const now = performance.now();
    if (now - lastKeyboardNavigationRef.current < 120) return;
    lastKeyboardNavigationRef.current = now;
    navigate(direction);
  }, [navigate]);
  const display = useCallback((href: string) => {
    const rendition = renditionRef.current;
    const session = readerSessionRef.current;
    if (!rendition) return;

    void rendition.display(href).then(async () => {
      if (session !== readerSessionRef.current) return;
      if (useReaderStore.getState().preferences.flow === "scrolled") {
        const container = viewportRef.current;
        const section = epubBookRef.current?.spine.get(href);
        if (container && section) {
          await settleScrolledTocTarget(container, section.index, href, () => (
            session === readerSessionRef.current
            && useReaderStore.getState().preferences.flow === "scrolled"
          ));
        }
      }
      await rendition.reportLocation();
    }).catch(() => toast.error("That section could not be opened."));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const readerState = useReaderStore.getState();
      if (event.repeat || readerState.tocOpen || readerState.settingsOpen) return;
      if (target?.closest("input, textarea, select, button, [role=slider], [role=listbox], [contenteditable=true]")) return;
      if (flow === "paginated" && event.key === "ArrowLeft") { event.preventDefault(); navigateWithKeyboard("previous"); }
      if (flow === "paginated" && event.key === "ArrowRight") { event.preventDefault(); navigateWithKeyboard("next"); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flow, navigateWithKeyboard]);

  useEffect(() => {
    const readerSession = ++readerSessionRef.current;
    let cancelled = false;
    let lastKnownProgress = 0;
    let saveTimer: ReturnType<typeof setTimeout> | undefined;
    let pendingPosition: { cfi: string; percentage: number } | undefined;
    let saveQueue = Promise.resolve();
    let resizeObserver: ResizeObserver | undefined;
    const container = viewportRef.current;
    if (!container) return;
    setReaderReady(false);
    setCurrentTocId(undefined);
    container.replaceChildren();

    const flushPosition = () => {
      if (!pendingPosition) return;
      const position = pendingPosition;
      pendingPosition = undefined;
      saveQueue = saveQueue.then(() =>
        libraryService.savePosition(bookId, position.cfi, position.percentage),
      ).catch(() => {
        if (!cancelled) toast.error("Reading position could not be saved.");
      });
    };
    const onPageHide = () => flushPosition();
    window.addEventListener("pagehide", onPageHide);

    const start = async () => {
      try {
        const [record, file] = await Promise.all([libraryService.getBook(bookId), libraryService.getBookFile(bookId)]);
        setLoading(true);
        setError(undefined);
        if (!record || !file) throw new Error("missing");
        if (cancelled) return;
        setBook(record);
        setProgress(record.progress);
        lastKnownProgress = record.progress;
        await libraryService.markOpened(bookId);

        const { default: ePub } = await import("epubjs");
        const epubBook = ePub(await file.arrayBuffer()) as EpubBook;
        epubBookRef.current = epubBook;
        await epubBook.ready;
        if (cancelled) return;
        const firstSection = epubBook.spine.first();
        if (!firstSection?.href) throw new Error("book has no readable spine item");
        let initialTarget = firstSection.href;
        const savedCfi = record.currentCfi?.trim();
        if (savedCfi) {
          try {
            if (epubBook.spine.get(savedCfi)) initialTarget = savedCfi;
          } catch {
            // A stale or malformed CFI must not enter EPUB.js's display queue.
          }
        }
        const bookToc = epubBook.navigation.toc as TocItem[];
        setToc(bookToc);

        const initialPreferences = useReaderStore.getState().preferences;
        const options: RenditionOptions = {
          width: "100%",
          height: "100%",
          manager: "continuous",
          flow: initialPreferences.flow === "scrolled" ? "scrolled-continuous" : "paginated",
          spread: "none",
          allowScriptedContent: false,
          resizeOnOrientationChange: true,
        };
        const rendition = epubBook.renderTo(container, options);
        renditionRef.current = rendition;

        await rendition.started;
        for (let frame = 0; frame < 60 && !container.querySelector(".epub-container"); frame += 1) {
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }
        if (cancelled || readerSession !== readerSessionRef.current) return;
        if (!container.querySelector(".epub-container")) throw new Error("rendition did not attach");

        resizeObserver = new ResizeObserver(() => {
          const rect = container.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) rendition.resize(rect.width, rect.height);
        });
        resizeObserver.observe(container);

        const initialRect = container.getBoundingClientRect();
        if (initialRect.width > 0 && initialRect.height > 0) rendition.resize(initialRect.width, initialRect.height);

        rendition.themes.register(readerThemes);
        const currentPreferences = useReaderStore.getState().preferences;
        applyReaderTheme(rendition, currentPreferences.theme);
        applyReaderTypography(rendition, currentPreferences.fontFamily, currentPreferences.fontSize, currentPreferences.lineHeight, currentPreferences.contentWidth);
        rendition.hooks.content.register((contents: { document: Document }) => {
          contents.document.body?.classList.toggle("miraf-scrolled", useReaderStore.getState().preferences.flow === "scrolled");
          let touchStart: { x: number; y: number } | undefined;
          contents.document.addEventListener("keydown", (event) => {
            const target = event.target as HTMLElement | null;
            const readerState = useReaderStore.getState();
            if (event.repeat || readerState.preferences.flow !== "paginated" || readerState.tocOpen || readerState.settingsOpen) return;
            if (target?.closest("input, textarea, select, button, [role=slider], [contenteditable=true]")) return;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              navigateWithKeyboard("previous");
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              navigateWithKeyboard("next");
            }
          });
          contents.document.addEventListener("touchstart", (event) => {
            const touch = event.touches[0];
            if (touch) touchStart = { x: touch.clientX, y: touch.clientY };
          }, { passive: true });
          contents.document.addEventListener("touchend", (event) => {
            const touch = event.changedTouches[0];
            if (!touch || !touchStart || useReaderStore.getState().preferences.flow !== "paginated") return;
            const horizontal = touch.clientX - touchStart.x;
            const vertical = touch.clientY - touchStart.y;
            touchStart = undefined;
            if (Math.abs(horizontal) > 70 && Math.abs(horizontal) > Math.abs(vertical) * 1.5) {
              navigate(horizontal > 0 ? "previous" : "next");
            }
          }, { passive: true });
          contents.document.querySelectorAll("script, iframe, object, embed, form").forEach((node) => node.remove());
          contents.document.querySelectorAll<HTMLElement>("[src]").forEach((node) => {
            const source = node.getAttribute("src");
            if (source && /^https?:/i.test(source)) node.removeAttribute("src");
          });
          contents.document.querySelectorAll<HTMLElement>("*").forEach((node) => {
            for (const attribute of Array.from(node.attributes)) {
              if (/^on/i.test(attribute.name)) node.removeAttribute(attribute.name);
              if (/^(srcset|poster|action)$/i.test(attribute.name) && /^https?:/i.test(attribute.value.trim())) {
                node.removeAttribute(attribute.name);
              }
            }
          });
          contents.document.addEventListener("click", (event) => {
            const target = event.target;
            const anchor = target && "closest" in target
              ? (target as Element).closest("a[href]")
              : null;
            if (!anchor) return;
            const href = anchor.getAttribute("href")?.trim() ?? "";
            if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) {
              event.preventDefault();
              event.stopImmediatePropagation();
            }
          }, true);
        });

        const updatePosition = (cfi: string, normalized: number) => {
          lastKnownProgress = normalized;
          setProgress(normalized);
          pendingPosition = { cfi, percentage: normalized };
          if (saveTimer) clearTimeout(saveTimer);
          saveTimer = setTimeout(flushPosition, useReaderStore.getState().preferences.flow === "paginated" ? 0 : 500);
        };

        const onRelocated = (location: Location) => {
          const cfi = location.start.cfi;
          setCurrentTocId(findCurrentTocId(bookToc, location.start.href));
          let percentage: number | undefined;
          if (epubBook.locations.length() > 0) {
            try { percentage = epubBook.locations.percentageFromCfi(cfi); }
            catch { /* The CFI remains usable even when a percentage cannot be found. */ }
          }
          const normalized = location.atEnd
            ? 100
            : typeof percentage === "number" && Number.isFinite(percentage)
              ? Math.max(0, Math.min(100, percentage * 100))
              : lastKnownProgress;
          updatePosition(cfi, normalized);
        };
        rendition.on("relocated", onRelocated);

        const firstRelocation = new Promise<boolean>((resolve) => {
          let finished = false;
          const finish = (relocated: boolean) => {
            if (finished) return;
            finished = true;
            window.clearTimeout(timeout);
            rendition.off("relocated", onFirstRelocated);
            resolve(relocated);
          };
          const onFirstRelocated = () => finish(true);
          const timeout = window.setTimeout(() => finish(false), 1200);
          rendition.once("relocated", onFirstRelocated);
        });

        let displayed = await displayWithTimeout(rendition, initialTarget);
        if (!displayed && initialTarget !== firstSection.href) {
          displayed = await displayWithTimeout(rendition, firstSection.href);
        }
        if (!displayed) {
          rendition.clear();
          displayed = await displayWithTimeout(rendition, firstSection.href);
        }
        if (!displayed) throw new Error("initial section did not render");
        if (cancelled || readerSession !== readerSessionRef.current) return;
        const relocated = Boolean(rendition.location?.start?.cfi) || await firstRelocation;
        if (!relocated) {
          const rect = container.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) rendition.resize(rect.width, rect.height);
          const fallbackTarget = rendition.location?.start?.cfi ?? initialTarget;
          const fallbackDisplayed = await displayWithTimeout(rendition, fallbackTarget);
          if (!fallbackDisplayed) throw new Error("initial section did not settle");
          await rendition.reportLocation().catch(() => undefined);
        }
        if (cancelled || readerSession !== readerSessionRef.current) return;
        setReaderReady(true);
        setLoading(false);
        void epubBook.locations.generate(1500).then(() => {
          if (cancelled || readerSession !== readerSessionRef.current) return;
          const cfi = rendition.location?.start?.cfi;
          if (cfi) {
            try {
              const percentage = epubBook.locations.percentageFromCfi(cfi);
              if (Number.isFinite(percentage)) updatePosition(cfi, Math.max(0, Math.min(100, percentage * 100)));
            } catch { /* Keep the last known progress when the current CFI cannot be mapped. */ }
          }
          return rendition.reportLocation();
        }).catch(() => undefined);
        return () => rendition.off("relocated", onRelocated);
      } catch {
        if (!cancelled) { setError("This book is missing or could not be rendered in this browser."); setReaderReady(false); setLoading(false); }
      }
    };

    let stopResize: (() => void) | undefined;
    void start().then((cleanup) => { stopResize = cleanup; });
    return () => {
      cancelled = true;
      if (readerSession === readerSessionRef.current) readerSessionRef.current += 1;
      stopResize?.();
      resizeObserver?.disconnect();
      window.removeEventListener("pagehide", onPageHide);
      if (saveTimer) clearTimeout(saveTimer);
      flushPosition();
      renditionRef.current?.destroy();
      epubBookRef.current?.destroy();
      renditionRef.current = undefined;
      epubBookRef.current = undefined;
      container.replaceChildren();
    };
  }, [bookId, navigate, navigateWithKeyboard]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const currentCfi = rendition.location?.start?.cfi;
    setReaderReady(false);
    let settled = false;

    const finishFlowChange = () => {
      if (settled) return;
      settled = true;
      setReaderReady(true);
    };

    rendition.once("relocated", finishFlowChange);
    applyReaderFlowClass(rendition, flow === "scrolled");
    rendition.flow(flow === "scrolled" ? "scrolled-continuous" : "paginated");

    const fallbackTimer = window.setTimeout(() => {
      if (settled) return;
      void rendition.display(currentCfi).then(() => rendition.reportLocation()).then(finishFlowChange).catch(() => {
        setError("The reading layout could not be changed. Try reopening this book.");
        finishFlowChange();
      });
    }, 600);

    return () => {
      settled = true;
      window.clearTimeout(fallbackTimer);
      rendition.off("relocated", finishFlowChange);
    };
  }, [flow]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;
    applyReaderTheme(rendition, preferences.theme);
  }, [preferences.theme]);

  useEffect(() => {
    const rendition = renditionRef.current;
    const container = viewportRef.current;
    if (!rendition || !container) return;

    const currentCfi = rendition.location?.start?.cfi;
    applyReaderTypography(rendition, preferences.fontFamily, preferences.fontSize, preferences.lineHeight, preferences.contentWidth);

    const reflowTimer = window.setTimeout(() => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) rendition.resize(rect.width, rect.height);
      void rendition.display(currentCfi).then(() => rendition.reportLocation()).catch(() => {
        toast.error("The page layout could not be refreshed.");
      });
    }, 80);

    return () => window.clearTimeout(reflowTimer);
  }, [preferences.contentWidth, preferences.fontFamily, preferences.fontSize, preferences.lineHeight]);

  return (
    <div className={cn("reader-shell flex h-dvh flex-col overflow-hidden", `reader-theme-${preferences.theme}`)}>
      {book ? <ReaderToolbar title={book.metadata.title} author={book.metadata.author} progress={progress} /> : <div className="h-[68px] border-b px-5 py-4"><Skeleton className="mx-auto h-8 w-56" /></div>}
      <main className="relative min-h-0 flex-1">
        <div
          ref={viewportRef}
          className={cn(
            "absolute inset-y-0",
            flow === "scrolled"
              ? "inset-x-0 w-full"
              : "left-1/2 w-[calc(100%-2rem)] -translate-x-1/2 sm:w-[calc(100%-7rem)]",
          )}
          style={flow === "paginated" ? { maxWidth: widthValues[preferences.contentWidth] } : undefined}
          aria-label="EPUB reading area"
        />
        {loading && <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[var(--reader-bg)]"><div className="w-[min(82vw,600px)] space-y-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-4/5" /></div></div>}
        {error && <div className="absolute inset-0 grid place-items-center bg-background p-6 text-center"><div><WarningCircleIcon className="mx-auto mb-4 size-9 text-destructive" aria-hidden /><h1 className="font-heading text-3xl">This chapter cannot open</h1><p className="mx-auto mt-3 max-w-md leading-7 text-muted-foreground">{error}</p><Button className="mt-6 h-11" onClick={() => router.push("/")}>Return to library</Button></div></div>}
        {!error && flow === "paginated" && <><Button variant="ghost" size="icon-lg" className="absolute left-2 top-1/2 z-10 hidden size-11 -translate-y-1/2 rounded-full bg-background/70 shadow-sm backdrop-blur-sm sm:inline-flex" onClick={previous} disabled={!readerReady} aria-label="Previous page" aria-keyshortcuts="ArrowLeft" title="Previous page (Left Arrow)"><CaretLeftIcon aria-hidden /></Button><Button variant="ghost" size="icon-lg" className="absolute right-2 top-1/2 z-10 hidden size-11 -translate-y-1/2 rounded-full bg-background/70 shadow-sm backdrop-blur-sm sm:inline-flex" onClick={next} disabled={!readerReady} aria-label="Next page" aria-keyshortcuts="ArrowRight" title="Next page (Right Arrow)"><CaretRightIcon aria-hidden /></Button></>}
      </main>
      {!error && flow === "paginated" && <div className="relative z-20 flex h-16 items-center gap-3 border-t px-4 sm:hidden"><Button variant="ghost" className="h-11 flex-1" onClick={previous} disabled={!readerReady} aria-keyshortcuts="ArrowLeft" title="Previous page (Left Arrow)"><CaretLeftIcon aria-hidden /> Previous</Button><Button variant="ghost" className="h-11 flex-1" onClick={next} disabled={!readerReady} aria-keyshortcuts="ArrowRight" title="Next page (Right Arrow)">Next <CaretRightIcon aria-hidden /></Button></div>}
      <div className="relative z-20 h-1 bg-primary/10" role="progressbar" aria-label="Book progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}><div className="h-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${progress}%` }} /></div>
      <TableOfContents items={toc} currentItemId={currentTocId} onSelect={display} />
      <ReaderSettings />
    </div>
  );
}
