# Admin home dashboard layout (clinic-wide)

**Date:** 2026-09-08  
**Status:** Approved for implementation

## Goal

Admins can customize the home dashboard: add/remove widgets from a catalog, rearrange them, and change discrete sizes on a 12-column grid. Layout is clinic-wide (same for every admin) and stored on `site_settings`.

## Non-goals (v1)

- Multiple instances of the same widget
- Per-user layouts
- Pixel-freeform resize
- Customizing greeting or filters bar

## UX

- Greeting + reservation filters stay fixed at the top.
- **Customize** on the home page enters edit mode (draft layout).
- In edit mode: drag onto another widget by edge — **top/bottom** inserts into the target's vertical stack, **left/right** creates adjacent stacks (`3+9`, `4+8`, `6+6`, …). Size chips (`3 | 4 | 6 | 8 | 9 | 12`), remove, **Add** from catalog.
- Widgets in one vertical stack keep independent widths; the stack column uses the widest member.
- Widget height is always content-sized (no stretch-to-neighbor).
- Charts are individual widgets (`chartVisitsWeek`, `chartBookingMix`, `chartStatus`, `chartBusyHours`, `chartDayTrend`); legacy `charts` expands on normalize. KPIs are individual and favor top/bottom drops when short.
- **Save** persists to Supabase; **Reset** restores the default layout in the draft (Save to persist).
- Exit without Save discards the draft (confirm if dirty).

## Data

`site_settings.dashboard_layout` — `jsonb`, ordered array:

```ts
{ id: DashboardWidgetId; colSpan: 3 | 4 | 6 | 8 | 9 | 12; stackId?: string }[]
```

Widget ids include attention/KPI cards, panels, and individual chart cards
(`chartVisitsWeek`, `chartBookingMix`, `chartStatus`, `chartBusyHours`,
`chartDayTrend`). Legacy `charts` / `attention` / `kpis` expand on normalize.

Invalid / missing JSON falls back to `DEFAULT_DASHBOARD_LAYOUT` (mirrors the pre-customize home).

## Rendering

`ClinicDashboard` groups placements by `stackId`. Each stack occupies one item
in the outer 12-column grid and renders its widgets in an independent vertical
column. This allows a second widget to occupy blank space beneath a shorter
neighbor. Ungrouped legacy placements are treated as one-widget stacks.

## Persistence

Load with the overview page; save via existing `upsertSettings` path (admin RLS).
