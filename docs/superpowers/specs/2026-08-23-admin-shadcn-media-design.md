# Admin CMS redesign + media uploads

**Date:** 2026-08-23  
**Project:** Glil / Imagineer (`video_repo`)  
**Status:** Draft for review

## Goal

Rebuild the admin dashboard on shadcn (light, clean CMS), then enable image/video uploads on every media field, expand case-study and featured seed data, and keep unlimited create/edit/delete.

## Decisions (locked)

| Topic | Choice |
|---|---|
| Phasing | **C** — Phase 1: shadcn + dashboard rebuild; Phase 2: uploads + migrations + seeds |
| Visual | **A** — Light, clean CMS (white/gray, subtle borders) |
| Layout | **C** — Sidebar + one page per section (routes already exist) |
| Media scope | Image + video on every media field (hero, about, case studies, featured, clients) |
| Media model | One URL + `media_type` toggle (`image` \| `video`) per field |
| Content volume | ~10 case studies + ~10 featured seeds; unlimited admin CRUD |

## Out of scope

- Public portfolio visual redesign (except rendering video where media_type requires it in Phase 2)
- Changing Supabase project / auth model
- Dual poster+video fields
- New shared UI outside the agreed shadcn set without asking first

---

## Phase 1 — shadcn dashboard rebuild

### Architecture

- Keep App Router structure under `src/app/admin/(dashboard)/` (hero, about, case-studies, featured, experience, clients, settings, login).
- `/admin` overview redirects to `/admin/hero` (or a thin overview card list — prefer redirect to keep one job per page).
- Rebuild shell: `AdminSidebar`, `AdminTopbar`, layout → Tailwind + shadcn primitives; remove reliance on legacy `.admin-*` board CSS for dashboard chrome.
- Keep Supabase services (`src/services/*`) and server page data fetching patterns; swap UI only.
- Feature code stays in `src/features/admin/`; shared primitives in `src/components/ui/`.

### shadcn setup

- Init shadcn for Next.js App Router + Tailwind v4 + TypeScript.
- Style: **New York**, base color **neutral** (or zinc), CSS variables, light mode default for admin.
- Install primitives (ask before adding others):
  - `button`, `input`, `textarea`, `label`, `select`, `card`, `separator`, `dialog`, `dropdown-menu`, `sonner`, `skeleton`, `table` (for list sections), `badge`, `tabs` (optional for draft/published filter)

### Page patterns

**Singletons** (Hero, About, Settings):

- One `Card` with form fields + primary **Save**.
- Toast on success/error via sonner.
- Phase 1: media fields remain text URL inputs (no file upload yet).

**Collections** (Case studies, Featured, Experience, Clients):

- Page shows a `Table` (or stacked list on mobile) of items: title, key meta, published badge, actions.
- **Add** creates a row (existing service create) and opens edit mode inline or navigates to focus that row’s form in a `Card` below / `Dialog`.
- Prefer: list + selected item edit `Card` on the same page (no board columns).
- Delete uses `Dialog` confirmation (no `window.confirm`).
- Unlimited items; no artificial caps.

### Component map (replace)

| Current | Phase 1 target |
|---|---|
| `AdminBoard` / columns / cards | `Table` + row actions |
| `AdminSidePanel` | Inline edit `Card` or `Dialog` |
| `*Form` / `*Editor` | shadcn form fields + same submit handlers |
| `LoginForm` | shadcn Card + Input + Button |
| Legacy admin CSS board styles | Tailwind utility classes on shell only |

### Data / errors

- Reuse `useBoardCrud` or slim to `useCollectionCrud` (same create/update/remove).
- Always handle loading, empty, and error on list/form pages.
- Files stay ≤ ~100 lines; named exports; no `any`.

### Phase 1 success criteria

- [ ] shadcn installed; primitives under `src/components/ui/`
- [ ] Admin shell is light sidebar + content; no kanban board
- [ ] All existing sections editable with shadcn forms
- [ ] Create / update / soft-delete still work against current schema
- [ ] Login page restyled; auth unchanged
- [ ] `yarn build` passes

---

## Phase 2 — media uploads, schema, seeds

### Schema migration (new file only)

Add `media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video'))` to:

- `case_studies` (alongside `media_url`)
- `featured_projects` (alongside `image_url` — keep column name)
- `about` (alongside `image_url`)
- `clients` (alongside `logo_url`)

Hero already has `media_type` + `media_url_desktop` / `media_url_mobile`.

RLS unchanged. Regenerate `src/lib/supabase/database.types.ts` after push.

**Rollback note:** drop the new `media_type` columns.

### Seeds

Replace/extend seed data to ~10 case studies and ~10 featured projects (rich demo copy; media URLs null or existing static fallbacks until uploads).

### Upload UX

- Upgrade `ImageUploadField` → `MediaUploadField`:
  - `media_type` select (image | video)
  - `accept` derived from type (`image/*` vs `video/*`)
  - Preview: `<img>` or `<video controls>`
  - Upload via existing `uploadPublicMedia` into the correct bucket
- Wire uploads on: Hero (desktop + mobile), About, Case study, Featured, Client logo.
- Keep optional paste-URL fallback only if useful; default is file upload.

### Public portfolio

- Where sections currently assume `<img>`, branch on `media_type` and render `<video>` when needed (muted/loop/playsInline for decorative; controls only if product requires).
- About image and client logos: support video the same way (per product decision).

### Storage

- Keep buckets: `hero`, `about`, `projects`, `clients`.
- Ensure policies allow admin write; public read.
- Accept common video MIME types; document practical size limits (Supabase plan).

### Phase 2 success criteria

- [ ] Migration applied + types regenerated
- [ ] ~10/10 seeds visible in admin and on site
- [ ] Every media field: type toggle + file upload works
- [ ] Public site renders image or video correctly
- [ ] Unlimited CRUD still works
- [ ] `yarn build` passes

---

## Implementation order

1. Phase 1 plan → implement → verify build
2. Phase 2 plan → migration → types → MediaUploadField → forms → public render → seeds → verify

## Testing

- Manual: login, edit each section, create/delete collection items
- Phase 2: upload small image + short mp4 per section; confirm public URL and render
- `yarn lint` / `yarn build` before calling done
