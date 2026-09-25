---
name: "Miraf Design System"
description: "The Chapter Ledger: a calm, literary interface for a private cross-device EPUB library."
colors:
  forest-ink: "#173F36"
  warm-white: "#FBFAF5"
  book-paper: "#FAF7F0"
  paper-surface: "#FDFBF7"
  popover-paper: "#FFFDF9"
  reading-ink: "#292C29"
  soft-field: "#F0ECE3"
  sage-wash: "#E1E8E2"
  quiet-text: "#686B66"
  ledger-rule: "#DED8CC"
  field-rule: "#D6D0C4"
  focus-green: "#35675B"
  error-red: "oklch(0.577 0.245 27.325)"
  reader-light: "#FFFDF8"
  reader-sepia: "#F2E7CF"
  reader-dark: "#1D2421"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(3rem, 6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "clamp(1.875rem, 3vw, 2.5rem)"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Inter, Arial, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.2
rounded:
  control: "10px"
  panel: "14px"
  pill: "9999px"
spacing:
  base: "4px"
  control-height: "44px"
  gutter-mobile: "20px"
  gutter-tablet: "32px"
  gutter-desktop: "48px"
  content-max: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.forest-ink}"
    textColor: "{colors.warm-white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "{spacing.control-height}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.reading-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "{spacing.control-height}"
  text-field:
    backgroundColor: "{colors.book-paper}"
    textColor: "{colors.reading-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "{spacing.control-height}"
  continue-panel:
    backgroundColor: "{colors.paper-surface}"
    textColor: "{colors.reading-ink}"
    rounded: "{rounded.panel}"
    padding: "24px"
---

# Design System: Miraf

## Overview

**Creative North Star: "The Chapter Ledger"**

Miraf, ምዕራፍ, means “chapter.” The product feels like opening a well-kept personal reading ledger: warm paper, deep green ink, fine rules, real book covers, and literary type organize a private collection without slipping into nostalgia. It is spacious and precise, with the current book and next reading action always leading the composition.

Authentication, library, synchronization, and recovery states all belong to this same visual world. Account surfaces use the forest-green brand field more expansively; operational states stay quiet and local to the decision at hand. Once a book opens, the interface recedes further so the EPUB page—not application chrome—owns attention.

**Key Characteristics:**

- Warm paper canvases with deep forest actions and fine ledger rules.
- Instrument Serif for literary identity; Inter for precise controls and status copy.
- One broad continuation panel followed by ruled editorial rows, never a dashboard grid.
- Sync is invisible when healthy and explicit only when the reader must understand or act.
- Reader chrome inherits the chosen page theme and remains quieter than the library.

## Colors

The palette pairs warm book paper with restrained forest green; structure comes primarily from spacing and fine rules rather than filled containers.

### Primary

- **Forest Ink:** Brand mark, primary actions, fallback covers, progress fills, selected items, and the desktop authentication story panel.
- **Warm White:** Text and icons placed on Forest Ink.

### Secondary

- **Sage Wash:** Selected or gently emphasized states that need green affinity without primary-action weight.
- **Soft Field:** Muted callouts, hover states, and low-emphasis control backgrounds.

### Neutral

- **Book Paper:** Main library, authentication form, and light application canvas.
- **Paper Surface:** Continuation panel and locally elevated paper surfaces.
- **Popover Paper:** Menus, toasts, and floating controls.
- **Reading Ink:** Primary text on light surfaces.
- **Quiet Text:** Metadata, instructions, percentages, timestamps, and secondary copy.
- **Ledger Rule:** Section separators, ruled rows, panels, and dialog boundaries.
- **Field Rule:** Input boundaries where a firmer edge improves recognition.
- **Focus Green:** Keyboard focus borders and rings.
- **Error Red:** Destructive actions and errors that require attention; never decorative.

The reader adds three bounded page themes: **Reader Light**, **Reader Sepia**, and **Reader Dark**. Chrome follows the active theme while preserving contrast.

**The Quiet Green Rule.** Forest Ink is purposeful and relatively scarce on library screens; healthy synchronization never earns another green badge.

**The State Needs Meaning Rule.** Error Red denotes a failed or destructive state, not urgency theater. Offline and in-progress states use Quiet Text with an icon and plain label.

## Typography

**Display Font:** Instrument Serif (with Georgia and serif fallbacks)

**Body Font:** Inter (with Arial and sans-serif fallbacks)

**Label/Mono Font:** Inter; reserve system monospace for genuinely code-like values.

**Character:** Instrument Serif gives Miraf a contemporary editorial voice without ornamental book styling. Inter keeps forms, metadata, controls, status messages, and recovery instructions modern and unambiguous.

### Hierarchy

- **Display** (400, `clamp(3rem, 6vw, 4.5rem)`, line-height `1`): Library and authentication introductions.
- **Headline** (400, `clamp(1.875rem, 3vw, 2.5rem)`, line-height `1.1`): Featured titles and major empty or recovery states.
- **Title** (400, `1.5rem`, line-height `1.2`): Sections, dialogs, drawers, migration, and ledger titles.
- **Body** (400, `1rem`, line-height up to `1.75`): Descriptions and instructions, generally bounded to about `65ch`.
- **Label** (500, `0.875rem`, line-height `1.2`): Forms and controls. Ledger column labels may use uppercase with `0.16em` tracking.

EPUB typography is user-controlled and separate from application type. Offer literary serif and clean sans options plus adjustable size, line height, width, and page or scroll flow.

**The Two Voices Rule.** Instrument Serif names the place, book, or moment; Inter explains state and enables action. Do not use display type for validation, sync copy, buttons, or dense metadata.

## Layout

The library frame has a `1440px` maximum width, gutters of `20px` mobile, `32px` tablet, and `48px` desktop, with an approximately `80px` header. Major vertical rhythm expands from roughly `48px` to `80px`.

The authenticated library proceeds from brand header and account actions to a generous introduction, optional migration callout, one continuation panel, and a ruled list. Desktop rows align cover, identity, progress, recency, and actions; mobile retains the cover and folds progress beneath identity. Loading uses skeletons in the intended composition. Empty, cache-failure, and cloud-failure states occupy a calm ruled region rather than a detached card.

Authentication is an editorial split screen on large viewports: a forest story panel beside a centered paper form no wider than about `430px`. On small screens, green becomes a shallow masthead containing only the wordmark; the form continues below in one column.

The reader fills the viewport with a `68px` toolbar, flexible EPUB viewport, mobile page controls when needed, and a one-pixel progress rail. Contents opens left and appearance right; each sheet uses at most about `92vw`.

**The One Broad Panel Rule.** The continuation feature is the library’s only broad bordered panel. Migration is a muted inline callout; ordinary books are ruled rows.

**The Page Owns the Reader Rule.** Never add permanent sidebars or dashboard furniture that reduce the book unless the reader explicitly opens a sheet.

## Elevation & Depth

Miraf is flat by default. Fine borders, paper tones, and space establish hierarchy. Book covers receive a restrained shadow (`0 16px 38px -24px rgba(18, 60, 53, 0.65)`); floating reader controls may use a small ambient shadow. Menus, dialogs, sheets, and toasts rely on quiet surface separation rather than dramatic lift.

The reader toolbar may use a `12px` backdrop blur over a `94%` theme-paper mix, but this is functional continuity—not a glass aesthetic.

**The Flat-by-Default Rule.** Surfaces rest on rules and tonal layering; shadows are reserved for physical book covers and controls that genuinely float above the page.

## Shapes

Controls and book covers use gently curved `10px` corners. Structural panels use `14px`. Icon controls, status wells, and progress tracks may be pills. Ledger rows do not gain enclosing radii because their top rule is the defining silhouette.

Use one-pixel borders for fields, panels, toolbars, dialogs, and section boundaries. Preserve covers at `2:3`; fallbacks use Forest Ink, a subtle book symbol, and the actual title.

**The Ledger Edge Rule.** Radius belongs to discrete controls and intentional panels, never every content group. Do not turn the library into nested rounded cards.

## Components

### Buttons

- **Shape:** `10px` corners with a preferred `44px` task-flow height.
- **Primary:** Forest Ink with Warm White text for Add Book, authentication, continuing, sync all, and principal recovery.
- **Hover / Focus:** Hover softens the fill without lifting. Focus uses a visible Focus Green ring. Pending actions change their label and prevent repeat activation.
- **Ghost / Outline:** Transparent rest states with Soft Field hover; outlined controls use Book Paper and Ledger Rule. Destructive actions use a pale Error Red field.

### Cards / Containers

- **Continue panel:** Paper Surface, `14px` corners, fine border, one cover at every breakpoint, prominent identity, progress, recency, and one action.
- **Migration callout:** Soft Field, `14px` corners, paper icon well, concise explanation, **Not now** and **Sync all**. Never blocks reading.
- **Auth story panel:** Full-height Forest Ink on desktop and shallow masthead on mobile; no decorative imagery.
- **Recovery regions:** Full-width ruled sections with centered icon, serif title, short explanation, and one recovery action.

### Inputs / Fields

- **Style:** Full-width `44px` paper fields with `10px` corners, Field Rule border, Inter labels, and restrained padding.
- **Focus:** Border shifts to Focus Green with a soft two-pixel ring.
- **Error / Success:** Form messages sit above submit in a `10px` tonal field and `aria-live` region. Errors use pale red; confirmation uses a faint Forest Ink wash.
- **Disabled / Pending:** Preserve legibility, disable repeats, and change the button verb to work in progress.

### Navigation

The wordmark combines the open-book symbol with “Miraf” in Instrument Serif. Library navigation pairs it with Add Book and a circular account trigger. The account menu names the signed-in email, offers legacy sync only when relevant, and ends with sign out.

Reader navigation keeps back, contents, and appearance in a symmetrical toolbar. Desktop page arrows float near viewport edges; mobile shows explicit Previous and Next. Icon-only controls have names and visible focus.

### Ledger Row

Use a top rule, cover, serif title, quiet author, progress, recency, and overflow. Normal synced rows show no status. **On this device**, **Syncing**, and **Sync needs attention** appear only when true; retry belongs in the affected row’s overflow.

### Progress

Use a `6px` rounded Forest Ink bar on a faint green track with a tabular percentage and semantic progress attributes. Width may animate over `300ms` unless reduced motion is requested.

### Dialogs, Sheets, and Toasts

Delete confirmation names the book, explains removal across account and reconnecting caches, and pairs **Keep book** with **Delete everywhere**. Contents and appearance use opposing side sheets with serif titles and Inter controls.

Toasts use Popover Paper, Ledger Rule, `12px` corners, and semantic icons. Use them for import, deletion, migration, storage, and recoverable reader failures. Loading resolves in place to success or failure. Keep transient banners out of the EPUB page.

### Sync and Error States

Global sync status appears in the header only for **Offline** or retryable error; healthy and routine syncing remain quiet. Cached books stay usable during cloud failure. An empty cloud failure gets a dedicated recovery region, while cache-open failure states that the local library did not open and offers **Try again**.

Reader-fatal failure replaces the viewport with **This chapter cannot open** and **Return to library**. Navigation, position-save, and layout-refresh failures use brief toasts.

## Do's and Don'ts

### Do:

- **Do** preserve Chapter Ledger hierarchy across authentication, library, sync, and recovery.
- **Do** keep covers visible on mobile and long-form text at a readable measure.
- **Do** show sync state only when it changes what the reader understands or can do.
- **Do** explain errors in one sentence and pair recoverable failures with one action.
- **Do** keep controls at least `40px`, preferably `44px`, with accessible names and visible focus.
- **Do** reduce nonessential animation for `prefers-reduced-motion: reduce`.

### Don't:

- **Don't** turn the library into a dashboard, repeat books in heavy cards, or add promotional statistics.
- **Don't** add gradients, oversized shadows, ornamental book motifs, faux paper, glass panels, or decorative badges.
- **Don't** show success badges on synced books or expose technical cloud/cache language in primary flows.
- **Don't** invent covers, metadata, quotations, reading statistics, claims, or proof.
- **Don't** let reader chrome compete with the page or hide essential controls behind hover.
- **Don't** use color alone for progress, errors, selection, offline, or sync status.
