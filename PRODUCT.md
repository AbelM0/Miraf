# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Miraf serves readers with personal DRM-free EPUB books who want a calm private library that follows them across desktop, tablet, and mobile. V2 requires an account so the library and reading position can remain available across devices.

## Product Purpose

Miraf is a private online EPUB reader with a Supabase-backed personal library and an account-scoped browser cache. It lets readers import an EPUB, read it in a focused interface, customize the experience, and continue from the same location on another device.

V2 succeeds when authentication, importing, cloud persistence, caching, opening, navigating, customizing, and cross-device resumption all feel dependable and unobtrusive.

## Positioning

Miraf leads with a calm reading experience. Private accounts, lazy downloads, browser caching, and a deliberately small interface keep cloud mechanics out of the reader's way.

## Operating Context

- Readers bring existing `.epub` files from their device and import one book at a time.
- EPUB files and covers are private in Supabase Storage; metadata, reading positions, and preferences are private PostgreSQL rows protected by RLS.
- IndexedDB retains account-scoped cached books and pending changes for speed and loaded-session offline reading.
- Readers move between a library view and a distraction-free reading view.
- Reading commonly spans multiple sessions and device orientations, so position restoration and responsive behavior are core workflows.
- Authentication is required. Cached books remain locked to their account after sign-out.
- A loaded session can read cached books offline and synchronize pending changes after reconnecting; offline cold start remains future PWA work.

## Capabilities and Constraints

- V1 supports DRM-free, reflowable EPUB 2 and EPUB 3 files up to 50 MiB.
- Fixed-layout EPUBs, encrypted/DRM-protected books, PDF, MOBI, and Kindle formats are unsupported.
- The library supports import, open, continue reading, and delete, with fallbacks for missing metadata or covers.
- The reader supports previous/next navigation, table of contents and chapter navigation, keyboard controls, progress, saved-position restoration, and responsive mobile behavior.
- Reading preferences cover light, sepia, and dark themes; font family, size, and line height; content width; and paginated or scrolling layout.
- Uploaded publication content is untrusted. Arbitrary EPUB JavaScript, popups, unsafe navigation, and remote publication resource loading must remain disabled or blocked.
- Supabase is the durable source of truth. IndexedDB is the account-scoped cache and lightweight pending-sync store. EPUB binaries never belong in transient application state.
- Clerk is the only authentication system. Google OAuth is the primary provider, with email/password retained as a dependable alternative through the same auth boundary. Supabase trusts Clerk session tokens for database and Storage authorization.
- Social features, annotations, highlights, reading dashboards, AI, text-to-speech, translation, recommendations, marketplaces, and public sharing remain outside V2.

## Brand Commitments

- The product name is **Miraf**, from the Amharic word **ምዕራፍ**, meaning “chapter.”
- The established identity uses a book/page motif and a deep green brand direction.
- The product voice and experience should remain simple, modern, calm, literary without feeling old-fashioned, spacious, and content-first.
- The reading view should feel quieter than the library.

## Evidence on Hand

- `DESIGN.md` records the implemented Miraf visual system. The user-supplied Nova reference is preserved in `design-reference/nova-os-landing-page-DESIGN.md`.
- The repository contains the Next.js library and reader, local persistence, EPUB import and rendering, and focused tests.
- No final Miraf logo file, production copy set, testimonials, customer claims, usage data, or public proof assets are currently present. Future work must not fabricate them.

## Product Principles

1. Protect the reading experience from setup, clutter, and unnecessary controls.
2. Make local ownership and reliable resumption feel effortless.
3. Prefer a small, understandable synchronization model over speculative distributed-system machinery.
4. Keep browser persistence, EPUB behavior, application state, and interface components cleanly separated.
5. Preserve a straightforward path to optional cloud accounts and synchronization later.

## Accessibility & Inclusion

V1 requires pragmatic accessibility fundamentals without an unconfirmed formal conformance claim: complete keyboard navigation, semantic controls, accessible names, visible focus states, sufficient contrast, sensible screen-reader labels, browser zoom support, and reduced-motion behavior where relevant.
