# Glil / Imagineer

Next.js portfolio + Supabase CMS.

## Commands

- `yarn dev` — local site + admin
- `yarn build` — production build
- `supabase link --project-ref puibdsyokgjdvkkousil`
- `supabase db push --linked` — apply migrations

## Layout

- `src/app` — routes (public `/`, admin `/admin`)
- `src/features` — portfolio + admin UI
- `src/services` — Supabase data access
- `supabase/migrations` — schema + seed

## Env

Copy `.env.example` → `.env.local` and fill anon key from
https://supabase.com/dashboard/project/puibdsyokgjdvkkousil/settings/api

## Admin login (local)

See [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

- URL: `/admin/login`
- Email: `admin@dentallounge.local`
- Password: `DentalLounge2026!`

Create the Auth user in Supabase once if it does not exist yet.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
