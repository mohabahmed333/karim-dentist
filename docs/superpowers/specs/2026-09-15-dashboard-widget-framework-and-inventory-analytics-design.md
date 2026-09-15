# Generic dashboard-widget framework + Inventory Analytics page

Date: 2026-09-15

## Goal

Generalize the Overview page's customizable-widget system (drag/resize/stack,
undo/redo, "+ Add widget" catalog, per-page saved layout) so any admin page
can offer the same UX, and build the first new consumer of it: a dedicated
**Inventory Analytics** page at `/admin/inventory/analytics`.

This is Part 1 of a two-part initiative. Part 2 (a Billing Analytics page,
reusing this same framework) is a **separate, later spec** — by design, once
Part 1 ships, adding Billing should require no framework changes, only a new
catalog + page + widgets.

## Part 1a: Framework generalization

### What moves, what stays

The current system lives entirely under `overview/` and is hard-wired to one
widget-id union (`DashboardWidgetId` in `dashboardLayoutCatalog.ts`). Splitting
by whether a file's *logic* cares which id it's handling (only its **types**
need to change) versus files with zero id-awareness already (pure move, no
signature change):

| File | Today | Genericization needed |
|---|---|---|
| `dashboardStacks.ts` | id-typed throughout | Real `<TId extends string>` work — logic is already id-agnostic |
| `dashboardLayoutBridge.ts` | id-typed + hardcoded global event names | Real `<TId extends string>` work on types (event names stay global — see below) |
| `DashboardWidgetFrame.tsx` | id-typed callback props | Real `<TId extends string>` work — logic just passes ids through |
| `dashboardLayoutHistory.ts` | depends on `DashboardLayout` type | No logic change, follows `dashboardLayout.ts`'s genericization |
| `dashboardDrop.ts`, `dashboardWidgetHeight.ts`, `dashboardLayoutMotion.ts`, `dashboardDragScroll.ts`, `DashboardWidgetHeightHandle.tsx`, `DashboardDropPlaceholder.tsx` | zero id-awareness today (confirmed by reading each) | Pure file move, no code change |

These move to two new shared homes:
- `src/features/admin/lib/dashboardWidgets/` — the generic pure layout engine
  (stacking/dropping/resizing math, undo/redo history, the col-span/catalog
  types) and the event bridge.
- `src/features/admin/components/dashboardWidgets/` — the generic UI shell
  (widget frame/chrome, drop placeholder, height-resize handle, the topbar
  edit/undo/redo/add/save controls, the "+ Add widget" catalog picker).

**Deliberately NOT generalized:** each page's widget-content layer — its
catalog of *which* widgets exist, its `render<Page>Widget` switch, and its
"Host" component. Overview's ctx (reservations, KPIs, doctor production,
billing/inventory chart stats) and Inventory Analytics's ctx (consumption
rows, batches, suppliers) are genuinely different data, so this layer stays
one-per-page — forcing a shared shape here would be a fake abstraction, not a
real one.

### The generic types

```ts
type DashboardCatalog<TId extends string> = {
  ids: readonly TId[];
  meta: (id: TId) => DashboardWidgetMeta<TId>;
  defaultLayout: DashboardLayout<TId>;
};
```

Every generic function (`normalizeDashboardLayout`, `missingDashboardWidgets`,
`addDashboardWidget`, `resizeDashboardWidget`, the stacking/dropping helpers,
etc.) becomes `<TId extends string>(..., catalog: DashboardCatalog<TId>, ...)`
— taking the catalog as an explicit parameter instead of importing one
hardcoded module-level constant, exactly mirroring today's function shapes
otherwise (same names, same argument order, one extra `catalog` argument).

### Keeping the refactor low-risk: bound per-page wrappers

Rather than touching every existing Overview call site to thread a `catalog`
argument through, `overviewDashboardCatalog.ts` (the renamed
`dashboardLayoutCatalog.ts`, unchanged content, now shaped as
`DashboardCatalog<OverviewWidgetId>`) is paired with a thin
`overviewDashboardLayout.ts` that partially applies the generic functions with
the Overview catalog baked in, re-exporting the **same names, same arity**
Overview's code already imports today:

```ts
export const missingDashboardWidgets = (layout, hidden) =>
  genericMissingDashboardWidgets(layout, OVERVIEW_CATALOG, hidden);
```

So `ClinicDashboard.tsx` and friends change their import path
(`@/features/admin/lib/dashboardLayout` → `@/features/admin/lib/overview/overviewDashboardLayout`)
and nothing else, for every function except the three that genuinely change
behavior (below). This is what makes "prove it on Overview" low-risk rather
than a full rewrite.

### The three real behavior changes

1. **`useDashboardLayoutEditor` takes an injected `save` function** instead of
   calling `upsertSettings` itself:
   `useDashboardLayoutEditor<TId>(catalog, initialLayout, save: (layout) => Promise<DashboardLayout<TId>>, hiddenWidgetIds?)`.
   The hook keeps its existing reconciliation logic ("trust the echoed-back
   layout unless it's missing heights we just wrote") — that's genuinely
   generic — but *how* a layout gets persisted is now the caller's problem.
   Overview's `ClinicDashboard.tsx` keeps its own settings-row state (moved
   out of the hook, into the component — a mechanical extraction) and passes
   a `save` closure wrapping today's `upsertSettings` call. Inventory
   Analytics's page passes a `save` closure wrapping a new, much simpler
   `upsertDashboardLayout(pageKey, layout)` call (see Data layer below).

2. **The bridge's `missing` list carries labels, not just ids.**
   `DashboardLayoutTopbarControls` renders globally on every admin route (via
   `AdminTopbar`, confirmed unconditional), so it can never import a specific
   page's catalog to look up labels. Today it doesn't need to — but once two
   different catalogs exist, it would. Fix: `DashboardLayoutUiState.missing`
   changes from `TId[]` to `{ id: string; labelKey: AnyMessageKey }[]`,
   computed by whichever page's hook is currently mounted (it already has its
   own catalog in scope). `DashboardWidgetCatalog.tsx` becomes fully
   catalog-agnostic — it renders whatever list it's handed.

3. **The bridge's event channel stays a single global `window` channel — not
   namespaced per page.** In this app, exactly one page component (and so
   exactly one `useDashboardLayoutEditor` instance) is ever mounted at a time,
   because Next.js's router unmounts the previous route's tree before
   mounting the next one. Two editors racing on the same event names would
   only be a real problem if some future page rendered two independent
   widget regions side by side — not needed today, and not worth the added
   complexity of per-region event scoping until it is. Called out explicitly
   as an accepted simplification, not an oversight.

### `DashboardColSpan` / `DASHBOARD_COL_SPANS`

These (3/4/6/8/9/12, and the `colSpanClass`/`colSpanLabelKey` helpers) aren't
id-specific at all — they move into the generic layer outright, no
genericization needed, just a new home.

## Part 1b: Data layer

New migration: a single small table, extensible to every future page without
another migration:

```sql
CREATE TABLE public.dashboard_layouts (
  page_key   text PRIMARY KEY,
  layout     jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY dashboard_layouts_admin_all ON public.dashboard_layouts
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
```

(RLS is the same blanket `is_admin()` gate this codebase already uses
elsewhere — e.g. `billing_payment_requests` — with fine-grained permission
checks like `inventory.view`/`settings.edit` enforced at the application
layer via `requirePagePermission`/`hasPermission`, matching how every other
permission in this app already works.)

New service module `src/services/dashboard_layouts/queries.ts` +
`mutations.ts`: `getDashboardLayout(supabase, pageKey)` and
`upsertDashboardLayout(supabase, pageKey, layout)`. **Overview keeps its
existing `site_settings.dashboard_layout` storage untouched** — no data
migration, no risk to what's already shipped. Only new pages use this table.

## Part 1c: Inventory Analytics page

- Route: `src/app/(internal)/admin/(dashboard)/inventory/analytics/page.tsx`.
- View permission: reuses `inventory.view` (per your call — same gate as the
  inventory widgets already on Overview).
- Layout-edit permission: reuses `settings.edit`, matching how Overview's
  "Customize layout" already works — no new permission rows needed anywhere
  for this feature. To be precise about what "matching" means: today, the
  customize-editor UI is available to anyone who can reach the page (there's
  no separate visibility gate on the edit button itself); the actual
  `save()` call is what's gated server-side by `settings.edit`, so a viewer
  without it can rearrange widgets locally but the save is rejected. The new
  page's `upsertDashboardLayout` server action enforces the identical gate,
  giving the identical (existing, not new) UX gap rather than inventing
  different semantics for the new page.
- Nav: a third entry alongside "Inventory" and "Reports" in both
  `adminRailItems` and `adminNavSections` in `adminNav.ts`
  (`/admin/inventory/analytics`), plus matching entries in
  `adminPageLabelKeys`/`adminPagePermissions` and new
  `admin.nav.inventoryAnalytics` i18n keys (en + ar).
- Unlike Overview's opt-in-only billing/inventory widgets, **all 6 widgets
  ship in the default layout** here — visiting a dedicated analytics page and
  finding it empty defeats the point. Still fully removable/resizable/
  reorderable through the same edit UI.

### Shared date-range control

A page-level picker with two presets — **Last 30 days / Last 90 days** (no
custom range; see Out of scope) — built the same way Overview's filter bar
works: a `nuqs`-based `createSearchParamsCache` (`range` param, `"30d" | "90d"`,
default `"30d"`) read server-side in `page.tsx`, with a matching client hook
for the picker component. Drives 4 of the 6 widgets:

- **Consumption trend** — daily bars over the selected range. (30 or 90 daily
  bars is a proven density in this exact codebase already — `ChartDayTrend`
  on Overview already renders 30 individual bars — so this isn't a new
  pattern, just a longer version of one that already works.) Data: the
  existing `listWeekConsumptionRows`/`buildWeekConsumptionChart` pair
  generalizes almost for free — both already take an arbitrary `from`/`to`;
  they're renamed (`listConsumptionRows`, `buildConsumptionTrendChart`) and
  their day-count changes from a fixed 7 to whatever the range resolves to.
- **Top consumed items** — `inventory_transactions` (`type = 'consumption'`)
  in range, grouped by `item_id`, ranked by summed `total_cost_egp`, joined to
  item name. Ranked-bar list, same visual form as the existing service-rank
  and stock-value-by-category widgets.
- **Supplier spend** — `inventory_transactions` (`type = 'restock'`) in range,
  joined `batch_id → inventory_batches.supplier_id → suppliers.name`
  (**not** `inventory_items.default_supplier_id` — a batch's actual supplier
  can differ from an item's default reorder supplier), summed
  `total_cost_egp` per supplier. A `NULL`/soft-deleted supplier groups under
  an "Unknown supplier" bucket rather than being dropped. Same ranked-bar
  form.
- **Wastage breakdown by reason** — `inventory_transactions`
  (`type = 'wastage'`) in range, grouped by `reason_code`, summed cost.
  Donut + legend, same form as Overview's payment-method-mix chart. In
  practice only a handful of `WASTAGE_REASON_CODES` ever appear under
  `type = 'wastage'` (the adjustment-only codes like `received_shipment`
  don't), but the chart caps at 8 slots and folds any excess into "Other" per
  the categorical-color rule already applied to the payment-method chart —
  never a generated 9th hue.

### Snapshot widgets (not range-dependent)

- **Expiring soon** — `inventory_batches` with `qty_remaining > 0` and
  `expires_on` within the next 30 days (fixed threshold, not user-configurable
  — see Out of scope), joined to item name, soonest-expiring first.
- **Reorder suggestions** — items where on-hand ≤ `min_stock_level` (same
  join Overview's low-stock KPI already uses, extended to return full rows
  instead of just a count): item name, on-hand qty, `reorder_qty`, and
  default supplier name.

## Testing

- The genericized pure functions (`dashboardStacks.ts`,
  `dashboardLayoutBridge.ts` types, `dashboardLayout.ts`) are covered by
  adapting the **existing** test suites
  (`dashboardLayout.test.ts`, `dashboardLayoutHistory.test.ts`,
  `dashboardDragScroll.test.ts`) to pass a small stub catalog — the point is
  to prove the refactor is behavior-preserving on Overview's own test suite,
  not just to add new tests.
- New pure functions backing the 6 Inventory Analytics widgets get the same
  co-located `*.test.ts` unit tests this codebase already writes for every
  stat-builder (empty input, single-row input, a range boundary, a
  null/unknown `reason_code` or missing `supplier_id`).
- Manual browser verification (same as the Overview billing/inventory
  widgets): sign in, add/resize/remove widgets on the new page, switch the
  30d/90d range, confirm no console errors, confirm Arabic labels render.

## Out of scope (this spec)

- The Billing Analytics page — separate future spec, reusing this framework
  with zero framework changes expected.
- Custom date ranges on Inventory Analytics — only the two presets.
- A configurable "expiring soon" threshold — fixed at 30 days.
- Any change to Overview's existing storage (`site_settings.dashboard_layout`)
  — it stays as-is.
- Per-admin-user (non-shared) layouts, on any page — layouts stay clinic-wide,
  matching Overview's existing behavior.
- Historical stock-value trend over time — there's no time-series snapshot of
  stock value in this schema today, only current `qty_remaining`; building
  that tracking is a separate, bigger piece of work if ever wanted.
