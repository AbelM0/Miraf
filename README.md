# Miraf

Miraf (ምዕራፍ, “chapter”) is a private, account-based EPUB reader. Books are stored in Supabase and cached in IndexedDB, so readers can open them quickly and continue at the same place on another device.

## Local setup

Requirements: Node.js, pnpm, Docker, a Clerk application, and a Supabase project for hosted environments.

```bash
pnpm install
pnpm exec supabase start
cp .env.example .env.local
pnpm dev
```

Use the local API URL and publishable key printed by `supabase start` in `.env.local`. Pull Clerk development keys with `clerk env pull`, then open [http://localhost:3000](http://localhost:3000).

For a hosted Supabase project:

1. Apply migrations with `pnpm exec supabase db push`.
2. Connect the Clerk instance from Clerk's **Connect with Supabase** setup page.
3. Add Clerk under Supabase **Authentication → Third-Party Auth** using the Clerk domain.
4. Configure the Supabase variables, Clerk keys, and optionally `NEXT_PUBLIC_MAX_EPUB_BYTES`.

### Clerk authentication

Miraf uses Clerk for sessions and Google/email sign-in. Supabase remains the private database and Storage backend and trusts Clerk session tokens through its native third-party-auth integration. Never expose `CLERK_SECRET_KEY` in browser code.

## V2 behavior

- Google OAuth is the primary account path, with email/password as an alternative. Clerk owns sessions and Next.js 16 Proxy route protection.
- Imported DRM-free, reflowable EPUB 2/3 files up to 50 MiB are validated, cached locally, and uploaded to a private per-user Storage path.
- EPUB files and covers stay in private buckets. PostgreSQL stores metadata, progress, preferences, and deletion tombstones behind RLS.
- The reader always renders an IndexedDB blob. A cloud-only EPUB downloads once, is revalidated, and remains cached.
- Reading progress is saved locally immediately and coalesced before cloud writes. Appearance preferences are account-scoped and synchronized.
- Existing V1 IndexedDB books are preserved and offered for migration after sign-in.
- Cached books remain after sign-out but are hidden from other accounts by application-level ownership checks.
- EPUB scripts and active content remain disabled.

Offline reading is supported for cached books while the app is loaded. A guaranteed offline cold start is not part of V2.

## Checks

```bash
pnpm lint
pnpm test
pnpm exec tsc --noEmit
pnpm build
pnpm exec supabase test db
```

## Project map

- `src/app/sign-in` and `src/app/sign-up`: Clerk account screens.
- `src/proxy.ts`: Clerk session and protected-route handling.
- `src/lib/supabase`: Supabase data client setup.
- `src/lib/cloud`: Supabase metadata and private Storage adapter.
- `src/lib/persistence`: versioned IndexedDB cache and V1 migration support.
- `src/lib/services/library-service.ts`: account-bound hybrid library and sync coordinator.
- `supabase/migrations`: database, RLS, and Storage definitions.
- `supabase/tests`: database security tests.
- `src/components/library` and `src/components/reader`: library and EPUB reader UI.
