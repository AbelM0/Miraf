# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Miraf primarily serves everyday EPUB readers, including the product owner, who already have personal DRM-free EPUB books and want a calm browser-based place to keep and read them. They may read on desktop, tablet, or mobile and expect to resume without setup or an account.

## Product Purpose

Miraf is a simple online EPUB reader with a personal browser-based library. It lets readers import an EPUB, retain the book locally, read it in a focused interface, customize the reading experience, and automatically continue from the last reading position.

V1 succeeds when importing, finding, opening, navigating, customizing, leaving, and resuming a book all feel dependable and unobtrusive.

## Positioning

Miraf leads with a calm reading experience. Local-first storage, no mandatory account, and a deliberately small interface support that promise by keeping setup and application chrome out of the reader's way.

## Operating Context

- Readers bring existing `.epub` files from their device and import one book at a time.
- The library, EPUB files, covers, metadata, reading positions, and progress remain in the current browser profile.
- Readers move between a library view and a distraction-free reading view.
- Reading commonly spans multiple sessions and device orientations, so position restoration and responsive behavior are core workflows.
- The first local-first release may require connectivity to load the application shell; installed books and state do not require a user account.

## Capabilities and Constraints

- V1 supports DRM-free, reflowable EPUB 2 and EPUB 3 files up to 50 MiB.
- Fixed-layout EPUBs, encrypted/DRM-protected books, PDF, MOBI, and Kindle formats are unsupported.
- The library supports import, open, continue reading, and delete, with fallbacks for missing metadata or covers.
- The reader supports previous/next navigation, table of contents and chapter navigation, keyboard controls, progress, saved-position restoration, and responsive mobile behavior.
- Reading preferences cover light, sepia, and dark themes; font family, size, and line height; content width; and paginated or scrolling layout.
- Uploaded publication content is untrusted. Arbitrary EPUB JavaScript, popups, unsafe navigation, and remote publication resource loading must remain disabled or blocked.
- IndexedDB is the V1 source of truth for books and reading state. Lightweight global preferences may use localStorage. EPUB binaries never belong in transient application state.
- Authentication, cloud sync, social features, annotations, highlights, reading dashboards, AI features, text-to-speech, translation, recommendations, and marketplaces are outside V1.
- The architecture must permit later Clerk authentication and Supabase persistence without forcing account or cloud concepts into V1 screens.

## Brand Commitments

- The product name is **Miraf**, from the Amharic word **ምዕራፍ**, meaning “chapter.”
- The established identity uses a book/page motif and a deep green brand direction.
- The product voice and experience should remain simple, modern, calm, literary without feeling old-fashioned, spacious, and content-first.
- The reading view should feel quieter than the library.

## Evidence on Hand

- `DESIGN.md` is a user-supplied visual reference in the project root.
- The repository contains the planned Next.js foundation and UI primitives, but no implemented Miraf product surface yet.
- No final Miraf logo file, production copy set, testimonials, customer claims, usage data, or public proof assets are currently present. Future work must not fabricate them.

## Product Principles

1. Protect the reading experience from setup, clutter, and unnecessary controls.
2. Make local ownership and reliable resumption feel effortless.
3. Prefer a small, understandable V1 over speculative features or abstractions.
4. Keep browser persistence, EPUB behavior, application state, and interface components cleanly separated.
5. Preserve a straightforward path to optional cloud accounts and synchronization later.

## Accessibility & Inclusion

V1 requires pragmatic accessibility fundamentals without an unconfirmed formal conformance claim: complete keyboard navigation, semantic controls, accessible names, visible focus states, sufficient contrast, sensible screen-reader labels, browser zoom support, and reduced-motion behavior where relevant.
