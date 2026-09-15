# Overview dashboard: billing & inventory charts

Date: 2026-09-15

## Goal

Add 8 new optional widgets to the admin overview dashboard (`/admin`), covering
billing and inventory, using the existing widget-catalog system (drag/resize,
"+ Add widget" picker, per-clinic saved layout). No new pages — this only
extends `AdminOverviewPage` and its widget plumbing.

## Widgets

| id | kind | col span | data |
|---|---|---|---|
| `chartBillingRevenue` | bar chart | 6 | EGP collected per day, Mon–Sun this week |
| `chartBillingMethodMix` | donut + list | 6 | share of this week's revenue by payment method |
| `kpiOutstandingBalance` | KPI card | 3 | total EGP currently owed, clinic-wide, live |
| `kpiPendingPayments` | KPI card | 3 | count of billing payment requests awaiting review |
| `chartInventoryStockValue` | bar chart | 6 | on-hand stock value (EGP) by item category, live |
| `chartInventoryConsumption` | bar chart | 6 | consumption cost (EGP) per day, Mon–Sun this week |
| `kpiLowStock` | KPI card | 3 | items at/below `min_stock_level`, live |
| `kpiPendingApprovals` | KPI card | 3 | inventory transactions with `approval_status = pending_review` |

All 8 are catalog-only (added via the "+" picker), not in
`DEFAULT_DASHBOARD_LAYOUT` — same convention as `myProductionWeek`. "This
week" always means the calendar Mon–Sun window (via the existing
`thisWeekRange()` helper in `page.tsx`), independent of the admin's date
filter bar, so these numbers don't silently change when someone filters
reservations to "today".

## Permissions

Billing widgets require `patients.view` (the same permission the `/admin/billing`
page itself is gated on). Inventory widgets require `inventory.view` (same as
`/admin/inventory`). `dashboard.view` alone is not enough.

`AdminOverviewPage` resolves `session.permissions` (already does, via
`requirePagePermission`) and computes:

```ts
const canViewBilling = hasPermission(session, "patients.view");
const canViewInventory = hasPermission(session, "inventory.view");
```

The billing/inventory data blocks are fetched only when the corresponding
flag is true (`Promise.all` entries become conditional, `null` otherwise —
same pattern the doctor-scoped `doctorProduction` fetch already uses).

`ClinicDashboard` receives `canViewBilling`/`canViewInventory` and:
1. Strips the 8 ids from `initialLayout` before handing it to
   `useDashboardLayoutEditor` when the corresponding flag is false, so a
   viewer without permission never renders an empty/broken card even if
   another admin already added the widget to the shared clinic layout.
2. Passes a `hiddenWidgetIds: DashboardWidgetId[]` array into
   `useDashboardLayoutEditor`, which threads it into both call sites of
   `missingDashboardWidgets(layout, hiddenWidgetIds)` so the "+ Add widget"
   catalog never offers a widget the viewer can't see.

`missingDashboardWidgets` gets an optional second parameter (default `[]`)
that's subtracted from the candidate id set — purely additive, no change to
existing callers.

## Data layer

### Billing

New in `src/services/patient_billing/queries.ts`:

- `listWeekPayments(supabase, from, to): Promise<WeekPaymentRow[]>` —
  `WeekPaymentRow = { date: string; amount: number; method: string }`. Merges
  `patient_billing_entries` (`kind = 'payment'`, `created_at` in range) with
  paid `deposit_requests` (`decided_at` in range, method forced to
  `"deposit"`). Pure merge logic split into an exported `mergeWeekPayments()`
  for unit testing, matching the existing `buildLedger`/`aggregatePatientBalances`
  split of pure-fn vs. I/O-fn in this file.

Reused as-is: `listPatientBalances` (outstanding total = sum of positive
balances), `listPendingBillingPayments` (`.length` for the KPI).

New in `src/features/admin/lib/dashboardBillingStats.ts` (pure, no I/O):

- `buildBillingWeekRevenue(rows: WeekPaymentRow[], now = new Date())` → 7-day
  `{ label, amount }[]`, Mon–Sun, same bucketing shape as
  `ReservationStats["weekCounts"]` so `ChartBillingRevenue` can reuse the
  existing bar-chart layout code from `ChartVisitsWeek`.
- `buildPaymentMethodMix(rows: WeekPaymentRow[])` → `{ method, amount, percent }[]`
  sorted descending, matching `ReservationStats["statusMix"]`'s shape/contract
  for `ChartBillingMethodMix` to reuse `ChartStatusMix`'s conic-gradient donut.

### Inventory

New `src/services/inventory/statsQueries.ts` (server-safe — the existing
`inventory/queries.ts` hardcodes the *browser* Supabase client via
`@/lib/supabase/client`, which cannot run in `AdminOverviewPage`'s server
component; this file takes a `ServerSupabase` param instead, matching
`patient_billing/queries.ts`'s convention):

- `getStockValueByCategory(supabase): Promise<{ category: string; value: number }[]>`
  — joins `inventory_batches (qty_remaining, unit_cost_egp)` to
  `inventory_items (category)`, filtered to non-deleted items, summed
  `qty_remaining * unit_cost_egp` per category.
- `getWeekConsumption(supabase, from, to): Promise<{ date: string; cost: number }[]>`
  — `inventory_transactions` where `type = 'consumption'` and `created_at`
  in range, summed `total_cost_egp` per day.
- `countLowStockItems(supabase): Promise<number>` — same logic as the
  existing client-side `listItemsBelowThreshold`, reimplemented against the
  server client (items with `min_stock_level > 0` whose summed
  `qty_remaining` across batches is `<=` that level).
- `countPendingApprovals(supabase): Promise<number>` — count of
  `inventory_transactions` where `approval_status = 'pending_review'`.

New in `src/features/admin/lib/dashboardInventoryStats.ts` (pure):

- `buildWeekConsumptionChart(rows, now)` → same 7-day bucket shape as above,
  feeds `ChartInventoryConsumption` (reuses the `ChartVisitsWeek` bar layout).
- Stock-value-by-category needs no further shaping beyond sorting by value
  descending and capping at, say, the top 8 categories (there are only 9
  possible category values total, so in practice this never truncates) —
  feeds `ChartInventoryStockValue`, rendered as horizontal bars (`ChartServiceRank`'s
  layout, reused) rather than a donut, since categories are a ranked list of
  values, not parts of one whole an admin scans for "which is biggest".

## Components

- `src/features/admin/components/overview/DashboardBillingCharts.tsx` —
  `ChartBillingRevenue`, `ChartBillingMethodMix`. Same `admin-card` chrome,
  `--admin-*` CSS variables, and bar/donut treatment as `DashboardCharts.tsx`.
- `src/features/admin/components/overview/DashboardInventoryCharts.tsx` —
  `ChartInventoryStockValue`, `ChartInventoryConsumption`. Same treatment.
- The 4 KPI widgets need no new component — a new
  `buildBillingInventoryKpis(outstanding, pendingPayments, lowStock,
  pendingApprovals)` in `dashboardModel.ts` produces 4 more `DashboardKpi`
  entries, concatenated onto the same `kpis` array passed to
  `ClinicDashboard` (only for the flags/values the viewer has permission
  for — a `null` block contributes no entry, so the KPI simply never
  appears rather than showing "0"). Rendered by the existing
  `DashboardKpiCard` via `KPI_BY_WIDGET` map additions in
  `renderDashboardWidget.tsx`. Money KPIs format as
  `` `${Math.round(value).toLocaleString()} EGP` `` — the plain-text EGP
  convention already used across the billing/inventory admin UI (no
  `Intl.NumberFormat('currency')` anywhere in this codebase). `trend` is
  always `"—"` (no prior-period comparison, matching `kpiPending`/`kpiServices`);
  `up` follows the same "attention" convention `kpiPending`/`kpiCancelled`
  already use — `true` (neutral/green) when the count is 0, `false`
  (red) when it's greater than 0 — for `kpiPendingPayments`, `kpiLowStock`,
  `kpiPendingApprovals`. `kpiOutstandingBalance` has no natural "good/bad"
  threshold, so it's always `up: true` (neutral), same as `kpiWeekTotal`.
- `renderDashboardWidget.tsx` gets 4 new `switch` cases for the charts.
  `DashboardWidgetRenderCtx` gains two new optional fields, `billingStats`
  and `inventoryStats` (each `null` when the viewer lacks permission or the
  underlying query failed) — the four chart `case`s return `null` when
  their ctx field is `null`, so an already-placed widget silently
  disappears for a viewer who loses permission, without a page crash.

## Catalog & i18n

`dashboardLayoutCatalog.ts`: 8 new entries in `DASHBOARD_WIDGET_IDS` and
`DASHBOARD_WIDGET_CATALOG` (charts use the existing `CHART` preset —
default 6, all spans allowed; KPIs use `CARD` — default 3). Not added to
`DEFAULT_DASHBOARD_LAYOUT`.

New message keys (both `en.ts` and `ar.ts`, proper Arabic translations, not
placeholders):
`admin.overview.widget.{chartBillingRevenue,chartBillingMethodMix,kpiOutstandingBalance,kpiPendingPayments,chartInventoryStockValue,chartInventoryConsumption,kpiLowStock,kpiPendingApprovals}`,
`admin.overview.kpi.{outstandingBalance,pendingPayments,lowStock,pendingApprovals}`,
`admin.overview.chart.{billingRevenue,billingRevenueDesc,billingMethodMix,billingMethodMixDesc,inventoryStockValue,inventoryStockValueDesc,inventoryConsumption,inventoryConsumptionDesc}`,
plus per-method labels under `admin.overview.chart.method.{cash,card,instapay,deposit,whatsapp,other}`
and per-category labels reusing whatever existing inventory category i18n
keys already exist in `src/services/inventory/i18nMaps.ts` (checked at
implementation time — do not duplicate if a category-label map already
exists there).

## Error handling

Every new query call is wrapped the same way the page already wraps
`listReservationsServer`/`listDoctorProductionThisWeek`: `.catch(() => null)`
(or `.catch(() => [])` for list-shaped results) so one failing billing/inventory
query degrades that section to "hidden" rather than 500ing the whole
dashboard. Charts/KPIs whose backing data is `null` are simply not rendered
(same as `doctorProduction`).

## Testing

- Unit tests (co-located `*.test.ts`, this repo's existing convention) for
  every new pure function: `mergeWeekPayments`, `buildBillingWeekRevenue`,
  `buildPaymentMethodMix`, `buildWeekConsumptionChart`, and the
  stock-value-by-category sort/shape helper. Cover: empty input, single-day
  data, a week straddling a month boundary, unknown/null `method` values
  (must not throw — bucket into `"other"`).
- No new query-layer tests beyond what's practical without a live Supabase —
  follow the existing pattern in `patient_billing/queries.test.ts` (which
  tests the pure `buildLedger`/`aggregatePatientBalances` functions, not the
  Supabase calls themselves).
- Manual verification via the `run` skill: load `/admin` as a role with both
  permissions (all 8 widgets addable and render real numbers), and as a
  role with neither (confirm the 8 ids never appear in the "+" catalog).

## Out of scope

- No new admin pages or drill-down links from these widgets.
- No historical trend beyond "this week" (no 30-day/monthly view).
- No changes to the existing billing/inventory pages themselves.
- No caching/memoization beyond what `force-dynamic` + existing
  `Promise.all` already gives the page.
