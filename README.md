# The Dental Lounge (Karim dentist)

Next.js portfolio + Supabase CMS and clinical EHR workspace.

## Quick start

```bash
cp .env.example .env.local   # fill Supabase anon URL/key
yarn
yarn dev
```

Open http://localhost:3000

Full steps: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

## Admin login

| | |
| --- | --- |
| URL | http://localhost:3000/admin/login |
| **Username (email)** | `admin@dentallounge.local` |
| **Password** | `DentalLounge2026!` |

Create this user once in the Supabase Auth dashboard (see [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)). Local/demo only.

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
- `prompts/` — AI prompt files

## Env

Copy `.env.example` → `.env.local` and fill keys from  
https://supabase.com/dashboard/project/puibdsyokgjdvkkousil/settings/api
