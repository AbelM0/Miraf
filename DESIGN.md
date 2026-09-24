---
version: "miraf-v1-chapter-ledger"
name: "Miraf Design System"
description: "A calm, literary interface for a private, local-first EPUB library and reader."
colors:
  primary: "#173F36"
  primary-foreground: "#FBFAF5"
  background: "#FAF7F0"
  surface: "#FDFBF7"
  foreground: "#292C29"
  muted: "#F0ECE3"
  muted-foreground: "#686B66"
  border: "#DED8CC"
  focus: "#35675B"
  reader-light: "#FFFDF8"
  reader-sepia: "#F2E7CF"
  reader-dark: "#1D2421"
typography:
  display:
    fontFamily: "Instrument Serif"
    fontWeight: 400
    lineHeight: "0.95–1.1"
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Inter"
    fontWeight: 400
    lineHeight: "1.5–1.75"
  control:
    fontFamily: "Inter"
    fontWeight: 500
    lineHeight: "1.2"
spacing:
  base: "4px"
  control-height: "44px"
  content-gutter-mobile: "20px"
  content-gutter-tablet: "32px"
  content-gutter-desktop: "48px"
  content-max-width: "1440px"
rounded:
  control: "10px"
  panel: "14px"
  pill: "9999px"
---

# Miraf Design System

Miraf, ምዕራፍ, means “chapter.” Its interface should feel like opening a well-kept personal reading ledger and then watching the application recede when the book begins.

The north star is **The Chapter Ledger**: a warm, spacious library organized with fine rules, real book covers, deep green actions, and large literary type. The reader is quieter than the library and keeps the EPUB page at the center of every decision.

## Product principles

### Book first

The current book, its cover, and the next reading action lead the composition. Interface furniture supports these elements without competing with them.

### Calm over density

Miraf is a personal shelf rather than a catalog or dashboard. Use generous space, short labels, and a small number of strong actions. Avoid statistics panels, promotional modules, and decorative data.

### Local trust

Copy should make local persistence understandable in plain language. Say that books remain in this browser when the information helps the user decide what to do. Do not turn privacy into a marketing badge repeated across the interface.

### Literary, not nostalgic

Instrument Serif provides an editorial voice. Inter keeps controls, metadata, and instructions current and precise. Avoid ornamental book motifs, faux paper textures, skeuomorphic shelves, and antique styling.

## Color system

### Library palette

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Canvas | `background` | `#FAF7F0` | Library background and large quiet areas |
| Surface | `card` | `#FDFBF7` | Continue panel, dialogs, and elevated local surfaces |
| Reading ink | `foreground` | `#292C29` | Primary text |
| Forest ink | `primary` | `#173F36` | Main actions, fallback covers, progress, and brand mark |
| Soft field | `muted` | `#F0ECE3` | Secondary backgrounds and hover states |
| Quiet text | `muted-foreground` | `#686B66` | Authors, timestamps, descriptions, and percentages |
| Rule | `border` | `#DED8CC` | Ledger rows, separators, and panel boundaries |
| Focus | `ring` | `#35675B` | Keyboard focus indication |

Use color by role. Forest green should remain purposeful and relatively scarce. Most structure comes from spacing and fine borders rather than filled containers.

### Reader palette

The reader supports three page themes:

| Theme | Page | Text | Link/accent |
| --- | --- | --- | --- |
| Light | `#FFFDF8` | `#292C29` | `#173F36` |
| Sepia | `#F2E7CF` | `#3D3429` | `#604C32` |
| Dark | `#1D2421` | `#E9E5DC` | `#B9D2C9` |

Reader chrome inherits the active page theme. It may use translucent backgrounds and restrained blur, but it must preserve text contrast and never obscure the book.

## Typography

### Display type

Use **Instrument Serif**, weight 400, for the wordmark, library introduction, book titles in featured contexts, empty-state headings, reader titles, and drawer headings.

- Library H1: `48–72px`, line-height near `1`, tracking around `-0.045em`.
- Featured book title: `30–40px`, line-height near `1.1`.
- Section heading: `24–30px`.
- Keep headings compact and let them breathe horizontally.

### Interface type

Use **Inter** for body copy, metadata, controls, progress, timestamps, toast messages, and settings.

- Body: `16–18px` with `1.65–1.75` line-height.
- Utility text: `14px`.
- Compact metadata: `11–12px`.
- Uppercase labels use moderate tracking between `0.14em` and `0.18em` and appear sparingly.

### EPUB content

Book typography is user-controlled and remains separate from the application design system. Provide literary serif and clean sans-serif options, adjustable size and line height, and narrow, standard, and wide reading measures.

## Layout

### Shared frame

- Maximum library width: `1440px`.
- Horizontal gutters: `20px` mobile, `32px` tablet, `48px` desktop.
- Main library rhythm: `48px` mobile, `64px` tablet, `80px` desktop.
- Header height: approximately `80px`.
- Prefer broad horizontal alignment and large quiet areas.

### Library

The library follows this order:

1. Brand header and primary **Add Book** action.
2. A large “Your library” introduction with one short supporting sentence.
3. One continuation panel for the most relevant book.
4. A ruled list of all imported books.
5. A quiet footer identifying Miraf and its local-first purpose.

The continuation panel is the only broad feature panel. It contains the cover, book identity, progress, recent activity, and one reading action. The rest of the collection uses rows instead of a repeated card grid.

### Reader

The reader occupies the viewport and uses a vertical structure:

1. Compact toolbar.
2. Flexible EPUB viewport.
3. Mobile navigation when appropriate.
4. One-pixel progress rail at the bottom.

The EPUB viewport receives nearly all available space. Desktop navigation sits near the left and right edges. Mobile uses bottom controls and drawer-based settings and contents.

## Components

### Wordmark

Combine the book/page icon with “Miraf” in Instrument Serif. Use forest green on light surfaces. Keep it compact and provide the accessible label “Miraf library.”

### Primary button

- Height: `44px`.
- Radius: `10px`.
- Background: forest ink.
- Text: warm white.
- Use for importing a book and beginning or continuing reading.
- Maintain a visible focus ring with an offset.

### Book cover

- Preserve a `2:3` aspect ratio.
- Radius: `10px`.
- Real cover art uses `object-fit: cover`.
- Missing covers use forest green, a subtle book icon, and the actual title.
- Cover shadow: `0 16px 38px -24px rgba(18, 60, 53, 0.65)`.

### Continue panel

- Radius: `14px` with a fine border.
- Use one cover at every breakpoint, including mobile.
- Keep title and author prominent.
- Show progress and one clear action.
- Do not add secondary promotional content.

### Ledger row

- Use a top rule rather than a surrounding card.
- Desktop columns: cover, book identity, progress, last opened, actions.
- Mobile columns: cover, identity with progress, actions.
- Row actions remain behind a clearly labelled overflow button.

### Progress

Use a thin forest bar on a faint green track with a tabular percentage. Progress must include semantic `progressbar` attributes and should never depend on color alone.

### Drawers and dialogs

Contents opens from the left; appearance opens from the right. On mobile, both occupy most of the width without covering the entire screen. Titles use Instrument Serif; controls and descriptions use Inter.

### Toasts

Use brief toasts for import success, deletion, storage problems, invalid EPUBs, and recoverable reader failures. Avoid placing transient banners inside the reading page.

## Responsive behavior

### Mobile

- Preserve book covers rather than collapsing to text-only rows.
- Place the continuation action below the book identity when needed.
- Use sheets for table of contents and settings.
- Provide explicit Previous and Next controls in paginated mode.
- Keep tap targets at least `40px`, preferably `44px`.

### Tablet

- Increase gutters and book-cover size.
- Retain the compact reader toolbar.
- Allow library metadata to occupy separate columns when space permits.

### Desktop

- Use the full ledger column structure.
- Place page navigation near the reader edges.
- Keep the reading measure bounded even on very wide displays.
- Do not add permanent reader sidebars that reduce the page unless the user opens one.

## Motion

Motion is brief and functional.

- Library rows may settle upward by `5px` over `280ms` with an ease-out curve.
- Progress width changes may animate over `300ms`.
- Hover states use color or subtle surface changes rather than dramatic lifts.
- Reader controls should feel immediate and should not animate the EPUB page unnecessarily.
- Disable nonessential animation and transitions when `prefers-reduced-motion: reduce` is active.

## Accessibility

- Every icon-only control requires an accessible name.
- Preserve visible `focus-visible` outlines on all interactive elements.
- Use semantic headings, buttons, links, navigation, and progress indicators.
- Maintain sufficient contrast across all three reader themes.
- Keyboard arrows navigate paginated books unless focus is inside an editable or interactive control.
- Do not communicate progress, errors, or selection through color alone.
- Drawers and dialogs must manage focus through their underlying accessible primitives.

## Content voice

Write calmly and directly. Prefer “Add Book,” “Continue,” “Start reading,” and “Return to library.” Explain errors in one sentence and offer a clear recovery action when possible.

Avoid grand claims, technical storage terminology in primary flows, literary clichés, and decorative microcopy. Use the actual book title and author whenever they are available.

## Guardrails

- Do not turn the library into a dashboard.
- Do not repeat every book inside a heavy card.
- Do not add gradients, oversized shadows, glass effects, or decorative badges.
- Do not invent book metadata, covers, quotes, or reading statistics.
- Do not let reader chrome compete with the EPUB page.
- Do not use localStorage for EPUB files or book metadata.
- Do not hide essential reading controls behind hover-only interactions.
- Keep fixed-layout books, annotations, social features, recommendations, and cloud-sync UI outside V1.

## Canonical implementation references

- Design tokens and reader theme classes: `src/app/globals.css`
- Library composition: `src/components/library/library-screen.tsx`
- Featured continuation: `src/components/library/continue-reading.tsx`
- Ledger rows: `src/components/library/book-row.tsx`
- Reader shell: `src/components/reader/reader-screen.tsx`
- Appearance controls: `src/components/reader/reader-settings.tsx`
- Original external reference: `design-reference/nova-os-landing-page-DESIGN.md`

The root `DESIGN.md` is the source of truth for Miraf. The Nova OS file is reference material only and must not replace this document.
