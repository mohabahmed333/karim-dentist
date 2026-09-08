# Dashboard canvas + panel theme — design

Approved: extend admin dashboard theme so **page background** (canvas) and **content surface** (panel) are editable via Settings and stored on Supabase `site_settings`, then applied across the whole admin shell.

## Goal

Operators can change:

1. **Canvas** — outer / page background (`--admin-canvas`, today `#F7F8F8`)
2. **Panel** — main content surface and cards (`--admin-panel`, today `#FFFFFF`)

alongside existing **Primary** and **Secondary** accents. Values live in Supabase and drive the live admin UI.

## Fields (`site_settings`)

| Column | Default | Check | Maps to |
|--------|---------|-------|---------|
| `dashboard_canvas_color` | `#F7F8F8` | hex `#RRGGBB` | `--admin-canvas` |
| `dashboard_panel_color` | `#FFFFFF` | hex `#RRGGBB` | `--admin-panel` |

Existing (unchanged): `dashboard_primary_color`, `dashboard_secondary_color`.

Migration mirrors `20260906210000_dashboard_theme_colors.sql`. Update generated/`database.types`, fallbacks, AI field allowlist, and `upsertSettings` payload.

## Application

- Admin layout loads all four colors from `site_settings`.
- `AdminShell` sets CSS variables: `--admin-primary`, `--admin-secondary`, `--admin-canvas`, `--admin-panel`.
- `ADMIN_THEME_EVENT` detail includes canvas + panel so Settings save updates without full reload.
- Portals / drawers that copy theme vars (`adminThemeStyle`, `useAdminThemeVars`) already read `--admin-canvas` / `--admin-panel` when present on `.admin-shell`.
- Sweep obvious hardcoded admin surfaces (`bg-white`, fixed `#F7F8F8` / `#F5F5F7` where they mean shell/content) to `var(--admin-panel)` / `var(--admin-canvas)` so the theme covers the whole dashboard. Do not restyle the public site.

## Settings UI

**Settings → Dashboard theme** (`SettingsDashboardForm`):

- Four color fields: Primary, Secondary, **Canvas**, **Panel** (picker + hex input).
- **Example preview**: mini layout — outer frame filled with canvas, inner rounded card filled with panel, plus primary/secondary chips (and outline) so operators see how the pair works before save.
- Zod `dashboardThemeSchema` validates all four hex values; save via existing `upsertSettings`.

## Supabase

Columns are writable on the `site_settings` row (same as primary/secondary). Editing hex in the dashboard table or saving from Settings both apply after reload / live event.

## Out of scope

- Customize → Settings duplicate editors (Settings form only).
- New tokens beyond canvas/panel (border, text, muted, sidebar-specific).
- Per-page or dark-mode themes.
- Public marketing site colors.
