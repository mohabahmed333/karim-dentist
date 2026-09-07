# Services page — design spec

**Date:** 2026-08-25  
**Status:** Approved (pending implementation)  
**Product:** Imagineer / Glil portfolio

## Goal

Add a **Services** experience matching the attached editorial list design (dark-adapted), with:

- Public homepage section (`#services`) **identical** to `/services`
- Hardcoded (non-CMS-editable) nav link to `/services`
- Customize editor for services content
- Admin dashboard CRUD entry
- Full Supabase migration (table + RLS + seed + settings intro)

## Decisions (locked)

| Topic | Choice |
|--------|--------|
| Theme | Dark adapt: black / cream; tags in red (or `--accent` if red conflicts) |
| Surface | Homepage section **+** `/services` page, **same items & layout** |
| Animation | Scroll reveal into stack **+** hover straighten/emphasis |
| Nav | Fixed Work-menu link — **not** editable via footer CMS |
| Data | Dedicated `services` table (not JSON blob) |

## Visual design

### Page chrome

- Black background (`#000` / `--bg`)
- Ruled index-style page title: **SERVICES** (uppercase, bold condensed, cream) + hairline with end caps (reuse `IndexRuledHeader` pattern)
- Optional page lede from `site_settings.services_description`
- Optional small decorative crosshair mark top-right of header (static SVG; not required for v1 if it fights the ruled header — prefer ruled header consistency with Case Studies / Featured)

### Service row (left → right)

1. **Index** — `01`, `02`, … (derived from sort order, not stored)
2. **Title** — large serif (`--font-serif`), cream
3. **Tags** — small stacked lines, **red** (`#e23a1b` or similar); stored as `text[]` or newline-separated text
4. **Description** — short body, muted cream
5. **Image** — rectangular thumb on the right (`image_url` + `media_type`)

Hairline separators between rows.

### Motion

1. **Scroll:** Lower rows start tilted / stacked (perspective + rotateX). As each row enters the viewport, it flattens to rest (`rotateX → 0`, opacity → 1). GSAP ScrollTrigger (existing motion system).
2. **Hover (pointer fine):** Active row emphasizes (slight scale / lift / full opacity); siblings can stay or deepen tilt slightly. Respect `prefers-reduced-motion`: no tilt; simple fade-in only.
3. **Touch:** No hover tilt requirement; scroll reveal only.

## Information architecture

### Routes

- `GET /` — include `<ServicesSection />` in home scroll (placement: after Featured / before Callout, unless layout review says otherwise — **default: after Featured, before Callout**)
- `GET /services` — SiteNav + full ServicesSection + SiteFooter (same pattern as `/experience`)

### Navigation

- Add `{ href: "/services", label: "Services" }` to Work group in `navMenuGroups` / `buildWorkNavLinks` — **always present** (not gated on item count)
- Do **not** add as a Customize-editable footer link by default; seed optional footer link only if we already seed Case Studies / Featured there (optional; not required for v1)

## Data model

### Table `public.services`

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | `gen_random_uuid()` |
| `title` | text NOT NULL | e.g. Brand |
| `tags` | text[] NOT NULL DEFAULT `'{}'` | e.g. `{Look & feel, Core Elements}` |
| `description` | text NOT NULL DEFAULT `''` | Body copy |
| `image_url` | text | Storage URL |
| `media_type` | text | Align with existing media_type check if present |
| `sort_order` | int NOT NULL DEFAULT 0 | |
| `is_published` | boolean NOT NULL DEFAULT true | |
| `created_at` / `updated_at` | timestamptz | |
| `deleted_at` | timestamptz | Soft delete |

Indexes: `(sort_order) WHERE deleted_at IS NULL`  
RLS: public read published non-deleted; admin all (mirror `clients` / `experience_entries`).

### `site_settings` additions

- `services_title` text NOT NULL DEFAULT `'Services'`
- `services_description` text NOT NULL DEFAULT `''`

### Seed

Three rows matching reference content:

1. Brand — tags Look & feel / Core Elements / Brand Guidelines + placeholder or `/design/...` image  
2. Campaign — Motion Design / Social Media / Art Direction  
3. Content — Motion & Photography  

## Customize

- New section id: `services` in `CUSTOMIZE_SECTIONS` + `COLLECTION_SECTIONS`
- Labels / DOM id `#services`
- Editor: page intro (title + description) + sortable list; item fields: title, tags, description, image upload, published
- Live preview: homepage canvas scrolls to `#services`; when Services section active, preview shows home (or dedicated services canvas if easier — **prefer homepage canvas with scroll-to-section**, consistent with Experience)
- Preview click → focus item in sidebar

## Admin dashboard

- Overview card count → `/admin/services`
- `/admin/services` list/create/edit following Experience or Clients pattern
- Sidebar nav entry under content sections

## Portfolio data layer

- Extend `getPortfolioData()` / `PortfolioData` with `services: Tables<"services">[]`
- Service module under `src/services/services/` (or fold into portfolio service) with Zod validation matching repo patterns
- Regenerate `database.types.ts` after migration push

## File touchpoints (implementation guide)

- Migration: `supabase/migrations/20260825XXXXXX_services.sql`
- UI: `ServicesSection.tsx`, row + motion helpers; styles in `globals.css`
- Pages: `src/app/services/page.tsx`; wire into `src/app/page.tsx`
- Nav: `navMenuGroups.ts`, `workNavLinks.ts`
- Customize: types, registry, panel, collection meta, mutations, preview
- Admin: dashboard page + overview + layout nav
- Types regen

## Out of scope (v1)

- Per-service detail pages / slugs  
- Editable nav label/href in CMS  
- Light theme Services page  
- Homepage teaser / truncated list  

## Success criteria

- [ ] `/services` and homepage `#services` render the same published list  
- [ ] Work menu includes non-editable Services → `/services`  
- [ ] Customize can CRUD/reorder services and edit intro; preview updates  
- [ ] Admin overview + `/admin/services` work  
- [ ] Migration applied with RLS; seed visible  
- [ ] Scroll + hover motion; reduced-motion safe  
- [ ] Dark theme only; red tags readable on black  

## Spec self-review

- No unresolved placeholders for locked decisions  
- No contradiction with dark / full-list / both-animations choices  
- Scope limited to one collection + page + customize + admin  
- Ambiguity resolved: home placement default = after Featured, before Callout  
