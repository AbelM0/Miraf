# Miraf

Miraf (ምዕራፍ, “chapter”) is a calm, local-first EPUB reader. Import a DRM-free EPUB, keep it in this browser, and return to the last reading position without an account.

## Run locally

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Production checks:

```bash
pnpm lint
pnpm test
pnpm build
```

## V1 behavior

- Import DRM-free, reflowable EPUB 2 or 3 files up to 50 MiB. Miraf checks the archive, reads metadata and cover when available, and rejects duplicate files.
- Store book records, original files, covers, and reading positions in IndexedDB. Reader appearance preferences use localStorage. Clearing site data or switching browser profiles removes the local library.
- Read in pages or a scrolling layout. Navigate with controls, table of contents, arrow keys, or a horizontal swipe in paginated mode.
- Choose light, sepia, or dark pages; font, size, line height, and reading width. EPUB scripts remain disabled.

The browser must load the application itself, but books do not require an account or cloud service. Clerk and Supabase are future additions; the current UI talks to a `BookRepository` interface through `libraryService`.

## Project map

- `src/app/page.tsx` and `src/app/read/[bookId]/page.tsx`: App Router entry points.
- `src/components/library` and `src/components/reader`: library and browser-only reader UI.
- `src/lib/epub`: archive validation and EPUB import.
- `src/lib/persistence`: versioned IndexedDB schema and repository implementation.
- `src/lib/services/library-service.ts`: UI-facing local data operations.
- `src/stores/reader-store.ts`: transient reader controls and persisted appearance preferences.
- `DESIGN.md`: Miraf’s implemented visual system. The supplied Nova source is preserved in `design-reference/`.

The test fixture under `tests/e2e/fixtures/` is a tiny generated EPUB for exercising import and rendering. `tests/e2e/capture-review.mjs` captures the populated library and reader at desktop and mobile widths when a production server is running.
