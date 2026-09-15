# Overview Billing & Inventory Charts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development (recommended) or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 new opt-in widgets (2 charts + 2 KPIs each for billing and inventory) to the admin overview dashboard's existing widget-catalog system, gated on the same permissions their source pages already use.

**Architecture:** Follows the codebase's existing "pure stat builder + thin I/O query + presentational chart component + catalog registration" layering already used for reservation charts. New billing/inventory data is fetched in `page.tsx` only when the viewer holds the matching permission, then flows through `ClinicDashboard` → `DashboardWidgetHost` → `renderDashboardWidget` exactly like every existing widget.

**Tech Stack:** Next.js server component (`page.tsx`) + Supabase (server client) for data; React client components for chart rendering; `node --test` (via `bash scripts/test.sh`) for unit tests on all pure functions.

## Global Constraints

- Design source of truth: `docs/superpowers/specs/2026-09-15-overview-billing-inventory-charts-design.md` — re-read it if anything below is ambiguous.
- Test runner: `bash scripts/test.sh` runs every `src/**/*.test.ts` via `node --experimental-strip-types --import ./scripts/test-loader.mjs --test`. To run one file: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test path/to/file.test.ts`. Tests use `node:test` + `node:assert/strict` (`describe`/`it`/`assert.equal`/`assert.deepEqual`), not vitest/jest.
- Typecheck with `yarn typecheck` (prefix `GITHUB_TOKEN=x` if yarn complains about config parsing) before considering any task done — `src/lib/i18n/messages/admin/ar.ts` is typed `Record<AdminMessageKey, string>`, so a missing or extra key in either `en.ts`/`ar.ts` is a compile error, not a runtime gap.
- All 8 new widget ids are catalog-only (added via the "+ Add widget" picker) — never added to `DEFAULT_DASHBOARD_LAYOUT`.
- "This week" always means the calendar Monday–Sunday window from the existing `thisWeekRange()` helper in `page.tsx`, independent of the admin's date-range filter bar.
- Billing widgets require permission key `"patients.view"`; inventory widgets require `"inventory.view"` — checked via `hasPermission(session, key)` from `@/lib/auth/permissions`. `dashboard.view` alone is not enough.
- Money values render as `` `${Math.round(value).toLocaleString()} EGP` `` — plain text, no `Intl.NumberFormat('currency')` (matches every existing EGP display in this codebase).
- Imports: relative and `@/`-aliased imports in both source and test files are written **without** a file extension (the custom test resolver in `scripts/test-resolve.mjs` adds `.ts` automatically) — match `src/services/patient_billing/queries.test.ts`'s style, not `dashboardLayout.test.ts`'s.
- New chart categorical colors (payment-method donut) come from the dataviz skill's validated default palette (`references/palette.md`), slots 1–6 in fixed order — see Task 8. Do not invent new hex values.

---

### Task 1: Billing queries — merge this-week payments, list them, sum outstanding balance

**Files:**
- Modify: `src/services/patient_billing/types.ts`
- Modify: `src/services/patient_billing/queries.ts`
- Modify: `src/services/patient_billing/queries.test.ts`

**Interfaces:**
- Consumes: existing `ServerSupabase` type and `PatientBalance` type already in `queries.ts`/`types.ts`.
- Produces: `WeekPaymentRow` type (`{ date: string; amount: number; method: string | null }`), `mergeWeekPayments(entries, deposits): WeekPaymentRow[]` (pure), `listWeekPayments(supabase, from, to): Promise<WeekPaymentRow[]>` (I/O), `sumOutstandingBalance(balances: PatientBalance[]): number` (pure). Consumed by Task 2 (`dashboardBillingStats.ts`) and Task 11 (`page.tsx`).

- [ ] **Step 1: Write the failing tests**

In `src/services/patient_billing/queries.test.ts`, change the top imports from:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregatePatientBalances, buildLedger } from "./queries";
import type { LedgerEntry } from "./types";
import type { PatientGroup } from "@/services/reservations/patientHistory";
```

to:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregatePatientBalances,
  buildLedger,
  mergeWeekPayments,
  sumOutstandingBalance,
} from "./queries";
import type { LedgerEntry, PatientBalance } from "./types";
import type { PatientGroup } from "@/services/reservations/patientHistory";
```

Then append at the end of the file (after the existing `aggregatePatientBalances` describe block's closing `});`):

```ts

describe("mergeWeekPayments", () => {
  it("merges billing entries and paid deposits, using decided_at for deposit dates", () => {
    const rows = mergeWeekPayments(
      [{ amount_egp: 300, method: "cash", created_at: "2026-09-14T10:00:00Z" }],
      [{ amount_egp: 500, decided_at: "2026-09-15T08:00:00Z", created_at: "2026-09-13T00:00:00Z" }],
    );
    assert.deepEqual(rows, [
      { date: "2026-09-14T10:00:00Z", amount: 300, method: "cash" },
      { date: "2026-09-15T08:00:00Z", amount: 500, method: "deposit" },
    ]);
  });

  it("falls back to created_at when a deposit has no decided_at", () => {
    const rows = mergeWeekPayments(
      [],
      [{ amount_egp: 200, decided_at: null, created_at: "2026-09-12T00:00:00Z" }],
    );
    assert.deepEqual(rows, [{ date: "2026-09-12T00:00:00Z", amount: 200, method: "deposit" }]);
  });

  it("returns an empty list when there is nothing to merge", () => {
    assert.deepEqual(mergeWeekPayments([], []), []);
  });
});

describe("sumOutstandingBalance", () => {
  it("sums only positive balances", () => {
    const balances: PatientBalance[] = [
      { patientKey: "a", displayName: "A", phone: "", balance: 500 },
      { patientKey: "b", displayName: "B", phone: "", balance: -200 },
      { patientKey: "c", displayName: "C", phone: "", balance: 100 },
    ];
    assert.equal(sumOutstandingBalance(balances), 600);
  });

  it("returns zero for an empty list", () => {
    assert.equal(sumOutstandingBalance([]), 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_billing/queries.test.ts`
Expected: FAIL — `mergeWeekPayments` and `sumOutstandingBalance` are not exported from `./queries` yet.

- [ ] **Step 3: Add the `WeekPaymentRow` type and implement `mergeWeekPayments`, `listWeekPayments`, `sumOutstandingBalance`**

In `src/services/patient_billing/types.ts`, add at the end of the file:

```ts

export type WeekPaymentRow = { date: string; amount: number; method: string | null };
```

In `src/services/patient_billing/queries.ts`, change the top import line:

```ts
import type { LedgerEntry, LedgerEntryWithBalance, PatientBalance } from "./types";
```

to:

```ts
import type {
  LedgerEntry,
  LedgerEntryWithBalance,
  PatientBalance,
  WeekPaymentRow,
} from "./types";
```

Then append at the end of the file:

```ts

type WeekEntryRow = { amount_egp: number; method: string | null; created_at: string };
type WeekDepositRow = { amount_egp: number; decided_at: string | null; created_at: string };

/** Merges this-week billing-entry payments and paid deposits into one list — pure, no I/O. */
export function mergeWeekPayments(
  entries: WeekEntryRow[],
  deposits: WeekDepositRow[],
): WeekPaymentRow[] {
  const fromEntries: WeekPaymentRow[] = entries.map((e) => ({
    date: e.created_at,
    amount: e.amount_egp,
    method: e.method,
  }));
  const fromDeposits: WeekPaymentRow[] = deposits.map((d) => ({
    date: d.decided_at ?? d.created_at,
    amount: d.amount_egp,
    method: "deposit",
  }));
  return [...fromEntries, ...fromDeposits];
}

/** This week's payments (manual/WhatsApp billing entries + paid deposits), from/to inclusive ISO bounds. */
export async function listWeekPayments(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<WeekPaymentRow[]> {
  const [entriesRes, depositsRes] = await Promise.all([
    supabase
      .from("patient_billing_entries")
      .select("amount_egp, method, created_at")
      .eq("kind", "payment")
      .gte("created_at", from)
      .lte("created_at", to),
    supabase
      .from("deposit_requests")
      .select("amount_egp, decided_at, created_at")
      .eq("status", "paid")
      .gte("decided_at", from)
      .lte("decided_at", to),
  ]);
  if (entriesRes.error) throw entriesRes.error;
  if (depositsRes.error) throw depositsRes.error;
  return mergeWeekPayments(entriesRes.data ?? [], depositsRes.data ?? []);
}

/** Sum of every patient's positive balance — total EGP currently owed, clinic-wide. */
export function sumOutstandingBalance(balances: PatientBalance[]): number {
  return balances.reduce((sum, b) => sum + Math.max(0, b.balance), 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/patient_billing/queries.test.ts`
Expected: PASS (all tests in the file, including the 5 new ones)

- [ ] **Step 5: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no new errors from `patient_billing/types.ts` or `patient_billing/queries.ts`.

- [ ] **Step 6: Commit**

```bash
git add src/services/patient_billing/types.ts src/services/patient_billing/queries.ts src/services/patient_billing/queries.test.ts
git commit -m "feat(billing): add week-payments merge/query and outstanding-balance sum"
```

---

### Task 2: Billing week-revenue and payment-method-mix pure stat builders

**Files:**
- Create: `src/features/admin/lib/dashboardBillingStats.ts`
- Test: `src/features/admin/lib/dashboardBillingStats.test.ts`

**Interfaces:**
- Consumes: `WeekPaymentRow` type from `@/services/patient_billing/types` (Task 1).
- Produces: `buildBillingWeekRevenue(rows: WeekPaymentRow[], now?: Date): WeekRevenuePoint[]`, `buildPaymentMethodMix(rows: WeekPaymentRow[]): PaymentMethodMixItem[]`, types `WeekRevenuePoint = { label: string; amount: number }`, `PaymentMethodMixItem = { method: string; amount: number; percent: number }`. Consumed by Task 8 (chart components) and Task 11 (`page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/lib/dashboardBillingStats.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBillingWeekRevenue, buildPaymentMethodMix } from "./dashboardBillingStats";
import type { WeekPaymentRow } from "@/services/patient_billing/types";

describe("buildBillingWeekRevenue", () => {
  // 2026-09-15 is a Tuesday; the week is Mon 2026-09-14 .. Sun 2026-09-20.
  const now = new Date(2026, 8, 15, 12, 0, 0);

  it("buckets amounts into the 7 days of the week containing `now`", () => {
    const rows: WeekPaymentRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 100, method: "cash" },
      { date: new Date(2026, 8, 15, 9, 0, 0).toISOString(), amount: 50, method: "card" },
      { date: new Date(2026, 8, 15, 15, 0, 0).toISOString(), amount: 25, method: "cash" },
    ];
    const chart = buildBillingWeekRevenue(rows, now);
    assert.equal(chart.length, 7);
    assert.equal(chart[0]!.amount, 100);
    assert.equal(chart[1]!.amount, 75);
    assert.equal(chart[2]!.amount, 0);
  });

  it("returns an all-zero week for no payments", () => {
    const chart = buildBillingWeekRevenue([], now);
    assert.deepEqual(chart.map((d) => d.amount), [0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("buildPaymentMethodMix", () => {
  it("buckets known methods and drops zero-amount ones, in fixed order", () => {
    const rows: WeekPaymentRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 100, method: "cash" },
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 300, method: "deposit" },
    ];
    const mix = buildPaymentMethodMix(rows);
    assert.deepEqual(mix, [
      { method: "cash", amount: 100, percent: 25 },
      { method: "deposit", amount: 300, percent: 75 },
    ]);
  });

  it("buckets a null or unrecognized method as other", () => {
    const rows: WeekPaymentRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 40, method: null },
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 10, method: "bank_transfer" },
    ];
    const mix = buildPaymentMethodMix(rows);
    assert.deepEqual(mix, [{ method: "other", amount: 50, percent: 100 }]);
  });

  it("returns an empty list for no payments", () => {
    assert.deepEqual(buildPaymentMethodMix([]), []);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardBillingStats.test.ts`
Expected: FAIL — `./dashboardBillingStats` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/admin/lib/dashboardBillingStats.ts`:

```ts
import type { WeekPaymentRow } from "@/services/patient_billing/types";

export type WeekRevenuePoint = { label: string; amount: number };
export type PaymentMethodMixItem = { method: string; amount: number; percent: number };

const KNOWN_METHODS = new Set(["cash", "card", "instapay", "deposit", "whatsapp"]);
const METHOD_ORDER = ["cash", "card", "instapay", "deposit", "whatsapp", "other"] as const;

function normalizeMethod(method: string | null): string {
  if (!method) return "other";
  return KNOWN_METHODS.has(method) ? method : "other";
}

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** EGP collected per day, Monday–Sunday, for the week containing `now`. */
export function buildBillingWeekRevenue(
  rows: WeekPaymentRow[],
  now = new Date(),
): WeekRevenuePoint[] {
  const weekStart = startOfWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const amount = rows
      .filter((row) => isSameDay(new Date(row.date), day))
      .reduce((sum, row) => sum + row.amount, 0);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      amount,
    };
  });
}

/** Share of this week's revenue by payment method, fixed order, zero-amount methods dropped. */
export function buildPaymentMethodMix(rows: WeekPaymentRow[]): PaymentMethodMixItem[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const method = normalizeMethod(row.method);
    totals.set(method, (totals.get(method) ?? 0) + row.amount);
  }
  const total = rows.reduce((sum, row) => sum + row.amount, 0) || 1;
  return METHOD_ORDER.map((method) => {
    const amount = totals.get(method) ?? 0;
    return { method, amount, percent: Math.round((amount / total) * 100) };
  }).filter((item) => item.amount > 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardBillingStats.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/lib/dashboardBillingStats.ts src/features/admin/lib/dashboardBillingStats.test.ts
git commit -m "feat(overview): add billing week-revenue and method-mix stat builders"
```

---

### Task 3: Inventory stats query module

**Files:**
- Create: `src/services/inventory/statsQueries.ts`
- Test: `src/services/inventory/statsQueries.test.ts`

**Interfaces:**
- Consumes: nothing new (uses the existing server-Supabase-client convention from `src/services/patient_billing/queries.ts` and `src/services/billing_payments/queries.ts`).
- Produces: types `CategoryStockValue = { category: string; value: number }`, `WeekConsumptionRow = { date: string; cost: number }`; functions `aggregateStockValueByCategory(rows): CategoryStockValue[]` (pure), `getStockValueByCategory(supabase): Promise<CategoryStockValue[]>` (I/O), `countItemsBelowThreshold(items, batches): number` (pure), `countLowStockItems(supabase): Promise<number>` (I/O), `countPendingApprovals(supabase): Promise<number>` (I/O), `listWeekConsumptionRows(supabase, from, to): Promise<WeekConsumptionRow[]>` (I/O). Consumed by Task 4 and Task 11 (`page.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `src/services/inventory/statsQueries.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateStockValueByCategory,
  countItemsBelowThreshold,
} from "./statsQueries";

describe("aggregateStockValueByCategory", () => {
  it("sums qty_remaining * unit_cost_egp per category, highest first", () => {
    const rows = [
      { qty_remaining: 10, unit_cost_egp: 5, item: { category: "disposable" } },
      { qty_remaining: 2, unit_cost_egp: 100, item: { category: "implant" } },
      { qty_remaining: 4, unit_cost_egp: 5, item: { category: "disposable" } },
    ];
    const result = aggregateStockValueByCategory(rows);
    assert.deepEqual(result, [
      { category: "implant", value: 200 },
      { category: "disposable", value: 70 },
    ]);
  });

  it("falls back to 'general' when the item join is missing", () => {
    const result = aggregateStockValueByCategory([
      { qty_remaining: 3, unit_cost_egp: 10, item: null },
    ]);
    assert.deepEqual(result, [{ category: "general", value: 30 }]);
  });

  it("drops zero-value categories and returns an empty list for no rows", () => {
    assert.deepEqual(aggregateStockValueByCategory([]), []);
    assert.deepEqual(
      aggregateStockValueByCategory([{ qty_remaining: 0, unit_cost_egp: 10, item: { category: "ppe" } }]),
      [],
    );
  });
});

describe("countItemsBelowThreshold", () => {
  it("counts items whose on-hand quantity is at or below their minimum", () => {
    const items = [
      { id: "a", min_stock_level: 10 },
      { id: "b", min_stock_level: 5 },
      { id: "c", min_stock_level: 0 },
    ];
    const batches = [
      { item_id: "a", qty_remaining: 4 },
      { item_id: "a", qty_remaining: 2 },
      { item_id: "b", qty_remaining: 20 },
    ];
    assert.equal(countItemsBelowThreshold(items, batches), 1);
  });

  it("ignores items with no minimum stock level set", () => {
    assert.equal(
      countItemsBelowThreshold([{ id: "a", min_stock_level: 0 }], []),
      0,
    );
  });

  it("treats an item with no batches at all as zero on hand", () => {
    assert.equal(
      countItemsBelowThreshold([{ id: "a", min_stock_level: 1 }], []),
      1,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/inventory/statsQueries.test.ts`
Expected: FAIL — `./statsQueries` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/services/inventory/statsQueries.ts`:

```ts
/**
 * Server-side inventory aggregate reads for the admin overview dashboard.
 * Unlike src/services/inventory/queries.ts (browser client only), these
 * take a ServerSupabase client so they can run from a server component.
 */

import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type CategoryStockValue = { category: string; value: number };
export type WeekConsumptionRow = { date: string; cost: number };

type BatchWithCategory = {
  qty_remaining: number;
  unit_cost_egp: number;
  item: { category: string } | null;
};

/** Sums qty_remaining * unit_cost_egp per item category — pure, no I/O. */
export function aggregateStockValueByCategory(
  rows: BatchWithCategory[],
): CategoryStockValue[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const category = row.item?.category ?? "general";
    totals.set(category, (totals.get(category) ?? 0) + row.qty_remaining * row.unit_cost_egp);
  }
  return [...totals.entries()]
    .map(([category, value]) => ({ category, value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value);
}

/** On-hand stock value (EGP) grouped by item category, highest first. */
export async function getStockValueByCategory(
  supabase: ServerSupabase,
): Promise<CategoryStockValue[]> {
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("qty_remaining, unit_cost_egp, item:inventory_items(category)")
    .gt("qty_remaining", 0);
  if (error) throw error;
  return aggregateStockValueByCategory((data ?? []) as unknown as BatchWithCategory[]);
}

type ItemThresholdRow = { id: string; min_stock_level: number };
type BatchQtyRow = { item_id: string; qty_remaining: number };

/** Count of items whose on-hand quantity is at or below their minimum stock level — pure, no I/O. */
export function countItemsBelowThreshold(
  items: ItemThresholdRow[],
  batches: BatchQtyRow[],
): number {
  const onHand = new Map<string, number>();
  for (const batch of batches) {
    onHand.set(batch.item_id, (onHand.get(batch.item_id) ?? 0) + batch.qty_remaining);
  }
  return items.filter(
    (item) => item.min_stock_level > 0 && (onHand.get(item.id) ?? 0) <= item.min_stock_level,
  ).length;
}

/** Items at/below their minimum stock level, clinic-wide. */
export async function countLowStockItems(supabase: ServerSupabase): Promise<number> {
  const [itemsRes, batchesRes] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, min_stock_level")
      .is("deleted_at", null)
      .gt("min_stock_level", 0),
    supabase.from("inventory_batches").select("item_id, qty_remaining"),
  ]);
  if (itemsRes.error) throw itemsRes.error;
  if (batchesRes.error) throw batchesRes.error;
  return countItemsBelowThreshold(itemsRes.data ?? [], batchesRes.data ?? []);
}

/** Inventory transactions currently awaiting a second admin's approval. */
export async function countPendingApprovals(supabase: ServerSupabase): Promise<number> {
  const { count, error } = await supabase
    .from("inventory_transactions")
    .select("id", { count: "exact", head: true })
    .eq("approval_status", "pending_review");
  if (error) throw error;
  return count ?? 0;
}

/** Raw consumption-transaction rows (cost + timestamp) in an inclusive ISO date range. */
export async function listWeekConsumptionRows(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<WeekConsumptionRow[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("total_cost_egp, created_at")
    .eq("type", "consumption")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw error;
  return (data ?? []).map((row) => ({ date: row.created_at, cost: row.total_cost_egp }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/services/inventory/statsQueries.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/inventory/statsQueries.ts src/services/inventory/statsQueries.test.ts
git commit -m "feat(inventory): add server-side stock-value, low-stock, and consumption queries"
```

---

### Task 4: Inventory week-consumption chart pure builder

**Files:**
- Create: `src/features/admin/lib/dashboardInventoryStats.ts`
- Test: `src/features/admin/lib/dashboardInventoryStats.test.ts`

**Interfaces:**
- Consumes: `WeekConsumptionRow` from `@/services/inventory/statsQueries` (Task 3).
- Produces: `InventoryWeekConsumptionPoint = { label: string; amount: number }`, `buildWeekConsumptionChart(rows: WeekConsumptionRow[], now?: Date): InventoryWeekConsumptionPoint[]`. Consumed by Task 8 and Task 11.

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/lib/dashboardInventoryStats.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWeekConsumptionChart } from "./dashboardInventoryStats";
import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

describe("buildWeekConsumptionChart", () => {
  // 2026-09-15 is a Tuesday; the week is Mon 2026-09-14 .. Sun 2026-09-20.
  const now = new Date(2026, 8, 15, 12, 0, 0);

  it("buckets consumption cost into the 7 days of the week containing `now`", () => {
    const rows: WeekConsumptionRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), cost: 120 },
      { date: new Date(2026, 8, 15, 9, 0, 0).toISOString(), cost: 30 },
      { date: new Date(2026, 8, 15, 15, 0, 0).toISOString(), cost: 20 },
    ];
    const chart = buildWeekConsumptionChart(rows, now);
    assert.equal(chart.length, 7);
    assert.equal(chart[0]!.amount, 120);
    assert.equal(chart[1]!.amount, 50);
    assert.equal(chart[2]!.amount, 0);
  });

  it("returns an all-zero week for no transactions", () => {
    const chart = buildWeekConsumptionChart([], now);
    assert.deepEqual(chart.map((d) => d.amount), [0, 0, 0, 0, 0, 0, 0]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardInventoryStats.test.ts`
Expected: FAIL — `./dashboardInventoryStats` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/features/admin/lib/dashboardInventoryStats.ts`:

```ts
import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

export type InventoryWeekConsumptionPoint = { label: string; amount: number };

function startOfWeek(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Consumption cost (EGP) per day, Monday–Sunday, for the week containing `now`. */
export function buildWeekConsumptionChart(
  rows: WeekConsumptionRow[],
  now = new Date(),
): InventoryWeekConsumptionPoint[] {
  const weekStart = startOfWeek(now);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const amount = rows
      .filter((row) => isSameDay(new Date(row.date), day))
      .reduce((sum, row) => sum + row.cost, 0);
    return {
      label: day.toLocaleDateString(undefined, { weekday: "short" }),
      amount,
    };
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardInventoryStats.test.ts`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/lib/dashboardInventoryStats.ts src/features/admin/lib/dashboardInventoryStats.test.ts
git commit -m "feat(overview): add inventory week-consumption chart builder"
```

---

### Task 5: Billing/inventory KPI builder

**Files:**
- Modify: `src/features/admin/lib/dashboardModel.ts`
- Test: `src/features/admin/lib/dashboardModel.test.ts` (new file)

**Interfaces:**
- Consumes: existing `DashboardKpi` type in the same file.
- Produces: `buildBillingInventoryKpis(input: { outstandingBalance: number | null; pendingPaymentsCount: number | null; lowStockCount: number | null; pendingApprovalsCount: number | null }): DashboardKpi[]`. Consumed by Task 11 (`page.tsx`).

- [ ] **Step 1: Write the failing test**

Create `src/features/admin/lib/dashboardModel.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBillingInventoryKpis } from "./dashboardModel";

describe("buildBillingInventoryKpis", () => {
  it("returns no entries when nothing is visible to the viewer", () => {
    const kpis = buildBillingInventoryKpis({
      outstandingBalance: null,
      pendingPaymentsCount: null,
      lowStockCount: null,
      pendingApprovalsCount: null,
    });
    assert.deepEqual(kpis, []);
  });

  it("formats visible values and flags non-zero counts as needing attention", () => {
    const kpis = buildBillingInventoryKpis({
      outstandingBalance: 1234.6,
      pendingPaymentsCount: 2,
      lowStockCount: 0,
      pendingApprovalsCount: 1,
    });
    assert.equal(kpis.length, 4);
    assert.equal(kpis[0]!.labelKey, "admin.overview.kpi.outstandingBalance");
    assert.match(kpis[0]!.value, /^1,?235 EGP$/);
    assert.equal(kpis[0]!.trend, "—");
    assert.equal(kpis[0]!.up, true);
    assert.deepEqual(kpis.slice(1), [
      { labelKey: "admin.overview.kpi.pendingPayments", value: "2", trend: "—", up: false },
      { labelKey: "admin.overview.kpi.lowStock", value: "0", trend: "—", up: true },
      { labelKey: "admin.overview.kpi.pendingApprovals", value: "1", trend: "—", up: false },
    ]);
  });

  it("includes only the fields the viewer has permission for", () => {
    const kpis = buildBillingInventoryKpis({
      outstandingBalance: 500,
      pendingPaymentsCount: null,
      lowStockCount: null,
      pendingApprovalsCount: null,
    });
    assert.equal(kpis.length, 1);
    assert.equal(kpis[0]!.labelKey, "admin.overview.kpi.outstandingBalance");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardModel.test.ts`
Expected: FAIL — `buildBillingInventoryKpis` is not exported from `./dashboardModel` yet.

- [ ] **Step 3: Write minimal implementation**

In `src/features/admin/lib/dashboardModel.ts`, append at the end of the file:

```ts

/** KPI cards for outstanding balance / pending payments / low stock / pending approvals. Each
 * field is `null` when the viewer lacks the permission for that section, in which case no
 * entry is produced for it (the KPI simply doesn't appear, rather than showing "0"). */
export function buildBillingInventoryKpis(input: {
  outstandingBalance: number | null;
  pendingPaymentsCount: number | null;
  lowStockCount: number | null;
  pendingApprovalsCount: number | null;
}): DashboardKpi[] {
  const kpis: DashboardKpi[] = [];
  if (input.outstandingBalance !== null) {
    kpis.push({
      labelKey: "admin.overview.kpi.outstandingBalance",
      value: `${Math.round(input.outstandingBalance).toLocaleString()} EGP`,
      trend: "—",
      up: true,
    });
  }
  if (input.pendingPaymentsCount !== null) {
    kpis.push({
      labelKey: "admin.overview.kpi.pendingPayments",
      value: String(input.pendingPaymentsCount),
      trend: "—",
      up: input.pendingPaymentsCount === 0,
    });
  }
  if (input.lowStockCount !== null) {
    kpis.push({
      labelKey: "admin.overview.kpi.lowStock",
      value: String(input.lowStockCount),
      trend: "—",
      up: input.lowStockCount === 0,
    });
  }
  if (input.pendingApprovalsCount !== null) {
    kpis.push({
      labelKey: "admin.overview.kpi.pendingApprovals",
      value: String(input.pendingApprovalsCount),
      trend: "—",
      up: input.pendingApprovalsCount === 0,
    });
  }
  return kpis;
}
```

Note: `"admin.overview.kpi.outstandingBalance"` etc. are added to `AdminMessageKey` in Task 7 — until then this file will fail to typecheck (not to run the test, since `node:test` here doesn't typecheck). That's expected; Task 7 runs before you do a full `yarn typecheck` pass at the end of Task 11.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardModel.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/lib/dashboardModel.ts src/features/admin/lib/dashboardModel.test.ts
git commit -m "feat(overview): add buildBillingInventoryKpis"
```

---

### Task 6: Widget catalog entries + permission-aware "missing widgets" filtering

**Files:**
- Modify: `src/features/admin/lib/dashboardLayoutCatalog.ts`
- Modify: `src/features/admin/lib/dashboardLayout.ts`
- Modify: `src/features/admin/lib/dashboardLayout.test.ts`
- Modify: `src/features/admin/hooks/useDashboardLayoutEditor.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: 8 new `DashboardWidgetId` values; `missingDashboardWidgets(layout, hiddenWidgetIds?)` gains an optional second parameter; `useDashboardLayoutEditor(initialSettings, initialLayout, hiddenWidgetIds?)` gains an optional third parameter, threaded into both of its `missingDashboardWidgets` calls. Consumed by Task 10 (`ClinicDashboard.tsx`).

- [ ] **Step 1: Add the 8 new widget ids to the catalog**

In `src/features/admin/lib/dashboardLayoutCatalog.ts`, change:

```ts
  "chartServiceRank",
  "myProductionWeek",
] as const;
```

to:

```ts
  "chartServiceRank",
  "myProductionWeek",
  "chartBillingRevenue",
  "chartBillingMethodMix",
  "kpiOutstandingBalance",
  "kpiPendingPayments",
  "chartInventoryStockValue",
  "chartInventoryConsumption",
  "kpiLowStock",
  "kpiPendingApprovals",
] as const;
```

Then change:

```ts
  {
    id: "myProductionWeek",
    labelKey: "admin.overview.widget.myProductionWeek",
    ...CARD,
  },
];
```

to:

```ts
  {
    id: "myProductionWeek",
    labelKey: "admin.overview.widget.myProductionWeek",
    ...CARD,
  },
  {
    id: "chartBillingRevenue",
    labelKey: "admin.overview.widget.chartBillingRevenue",
    ...CHART,
  },
  {
    id: "chartBillingMethodMix",
    labelKey: "admin.overview.widget.chartBillingMethodMix",
    ...CHART,
  },
  {
    id: "kpiOutstandingBalance",
    labelKey: "admin.overview.widget.kpiOutstandingBalance",
    ...CARD,
  },
  {
    id: "kpiPendingPayments",
    labelKey: "admin.overview.widget.kpiPendingPayments",
    ...CARD,
  },
  {
    id: "chartInventoryStockValue",
    labelKey: "admin.overview.widget.chartInventoryStockValue",
    ...CHART,
  },
  {
    id: "chartInventoryConsumption",
    labelKey: "admin.overview.widget.chartInventoryConsumption",
    ...CHART,
  },
  {
    id: "kpiLowStock",
    labelKey: "admin.overview.widget.kpiLowStock",
    ...CARD,
  },
  {
    id: "kpiPendingApprovals",
    labelKey: "admin.overview.widget.kpiPendingApprovals",
    ...CARD,
  },
];
```

Do not add any of these 8 to `DEFAULT_DASHBOARD_LAYOUT` — they are catalog-only.

This file has no dedicated test; it is exercised transitively by `dashboardLayout.test.ts` (Step 3 below) and by `yarn typecheck` (all `labelKey`s must resolve once Task 7 adds them).

- [ ] **Step 2: Write the failing test for hidden-widget filtering**

In `src/features/admin/lib/dashboardLayout.test.ts`, find:

```ts
  it("lists missing catalog widgets for add picker", () => {
    const missing = missingDashboardWidgets(DEFAULT_DASHBOARD_LAYOUT);
    assert.ok(missing.includes("kpiCancelled"));
    assert.ok(missing.includes("listPending"));
    assert.ok(missing.includes("chartWeekCompare"));
    assert.ok(missing.includes("attentionNoShow"));
  });
});
```

and change it to:

```ts
  it("lists missing catalog widgets for add picker", () => {
    const missing = missingDashboardWidgets(DEFAULT_DASHBOARD_LAYOUT);
    assert.ok(missing.includes("kpiCancelled"));
    assert.ok(missing.includes("listPending"));
    assert.ok(missing.includes("chartWeekCompare"));
    assert.ok(missing.includes("attentionNoShow"));
  });

  it("excludes hidden widget ids from the missing list", () => {
    const missing = missingDashboardWidgets(DEFAULT_DASHBOARD_LAYOUT, [
      "kpiCancelled",
      "listPending",
    ]);
    assert.ok(!missing.includes("kpiCancelled"));
    assert.ok(!missing.includes("listPending"));
    assert.ok(missing.includes("chartWeekCompare"));
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardLayout.test.ts`
Expected: FAIL on the new test — `missingDashboardWidgets` doesn't accept a second argument yet (it will simply ignore it and the assertions will fail since `kpiCancelled`/`listPending` will still be present in `missing`).

- [ ] **Step 4: Implement the `hiddenWidgetIds` parameter**

In `src/features/admin/lib/dashboardLayout.ts`, change:

```ts
export function missingDashboardWidgets(
  layout: DashboardLayout,
): DashboardWidgetId[] {
  const present = new Set(layout.map((w) => w.id));
  return DASHBOARD_WIDGET_IDS.filter((id) => !present.has(id));
}
```

to:

```ts
export function missingDashboardWidgets(
  layout: DashboardLayout,
  hiddenWidgetIds: readonly DashboardWidgetId[] = [],
): DashboardWidgetId[] {
  const present = new Set(layout.map((w) => w.id));
  const hidden = new Set(hiddenWidgetIds);
  return DASHBOARD_WIDGET_IDS.filter((id) => !present.has(id) && !hidden.has(id));
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --experimental-strip-types --import ./scripts/test-loader.mjs --test src/features/admin/lib/dashboardLayout.test.ts`
Expected: PASS (all tests in the file)

- [ ] **Step 6: Thread `hiddenWidgetIds` through `useDashboardLayoutEditor`**

In `src/features/admin/hooks/useDashboardLayoutEditor.ts`, change the function signature:

```ts
export function useDashboardLayoutEditor(
  initialSettings: SiteSettings | null,
  initialLayout: DashboardLayout,
) {
```

to:

```ts
export function useDashboardLayoutEditor(
  initialSettings: SiteSettings | null,
  initialLayout: DashboardLayout,
  hiddenWidgetIds: DashboardWidgetId[] = [],
) {
```

Then change the two `missingDashboardWidgets(draft)` call sites. First, inside the `useEffect`:

```ts
  useEffect(() => {
    publishDashboardLayoutState({
      active: true,
      editing,
      dirty,
      saving,
      catalogOpen,
      canUndo,
      canRedo,
      missing: missingDashboardWidgets(draft),
    });
  }, [
    editing,
    dirty,
    saving,
    catalogOpen,
    canUndo,
    canRedo,
    draft,
    historyEpoch,
  ]);
```

to:

```ts
  useEffect(() => {
    publishDashboardLayoutState({
      active: true,
      editing,
      dirty,
      saving,
      catalogOpen,
      canUndo,
      canRedo,
      missing: missingDashboardWidgets(draft, hiddenWidgetIds),
    });
  }, [
    editing,
    dirty,
    saving,
    catalogOpen,
    canUndo,
    canRedo,
    draft,
    historyEpoch,
    hiddenWidgetIds,
  ]);
```

Second, in the returned object:

```ts
    missing: missingDashboardWidgets(draft),
```

to:

```ts
    missing: missingDashboardWidgets(draft, hiddenWidgetIds),
```

(There are exactly two occurrences of `missingDashboardWidgets(draft)` in this file — one inside the `useEffect` above, one in the object returned at the end of the hook. Both must change.)

- [ ] **Step 7: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: errors only about the still-missing i18n keys (`admin.overview.widget.chartBillingRevenue` etc.) and `ClinicDashboard`/`page.tsx` not yet passing the new hook argument — both resolved by later tasks. No errors from `dashboardLayout.ts` or `useDashboardLayoutEditor.ts` themselves.

- [ ] **Step 8: Commit**

```bash
git add src/features/admin/lib/dashboardLayoutCatalog.ts src/features/admin/lib/dashboardLayout.ts src/features/admin/lib/dashboardLayout.test.ts src/features/admin/hooks/useDashboardLayoutEditor.ts
git commit -m "feat(overview): register 8 new widget ids and permission-hide them from the catalog"
```

---

### Task 7: i18n keys (English + Arabic)

**Files:**
- Modify: `src/lib/i18n/messages/admin/en.ts`
- Modify: `src/lib/i18n/messages/admin/ar.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: every `AdminMessageKey` referenced by Tasks 5, 6, 8, 9. `ar.ts` is typed `Record<AdminMessageKey, string>`, so both files must gain exactly the same key set or `yarn typecheck` fails.

- [ ] **Step 1: Add English keys**

In `src/lib/i18n/messages/admin/en.ts`, find:

```ts
  "admin.overview.kpi.unreadChats": "Unread chats",
```

and change it to:

```ts
  "admin.overview.kpi.unreadChats": "Unread chats",
  "admin.overview.kpi.outstandingBalance": "Outstanding balance",
  "admin.overview.kpi.pendingPayments": "Pending payments",
  "admin.overview.kpi.lowStock": "Low stock items",
  "admin.overview.kpi.pendingApprovals": "Pending approvals",
```

Find:

```ts
  "admin.overview.widget.myProductionWeek": "My production this week",
```

and change it to:

```ts
  "admin.overview.widget.myProductionWeek": "My production this week",
  "admin.overview.widget.chartBillingRevenue": "Billing revenue this week",
  "admin.overview.widget.chartBillingMethodMix": "Payment method mix",
  "admin.overview.widget.kpiOutstandingBalance": "Outstanding balance",
  "admin.overview.widget.kpiPendingPayments": "Pending payments",
  "admin.overview.widget.chartInventoryStockValue": "Stock value by category",
  "admin.overview.widget.chartInventoryConsumption": "Inventory consumption this week",
  "admin.overview.widget.kpiLowStock": "Low stock items",
  "admin.overview.widget.kpiPendingApprovals": "Pending inventory approvals",
```

Find:

```ts
  "admin.overview.chart.serviceRank": "Service ranking",
  "admin.overview.chart.serviceRankDesc": "Most booked services",
```

and change it to:

```ts
  "admin.overview.chart.serviceRank": "Service ranking",
  "admin.overview.chart.serviceRankDesc": "Most booked services",
  "admin.overview.chart.billingRevenue": "Revenue this week",
  "admin.overview.chart.billingRevenueDesc": "EGP collected per day",
  "admin.overview.chart.billingMethodMix": "Payment method mix",
  "admin.overview.chart.billingMethodMixDesc": "Share of this week's revenue by method",
  "admin.overview.chart.billingMethodMixEmpty": "No payments yet.",
  "admin.overview.chart.inventoryStockValue": "Stock value by category",
  "admin.overview.chart.inventoryStockValueDesc": "On-hand stock value (EGP) by category",
  "admin.overview.chart.inventoryStockValueEmpty": "No stock on hand yet.",
  "admin.overview.chart.inventoryConsumption": "Consumption this week",
  "admin.overview.chart.inventoryConsumptionDesc": "Consumption cost (EGP) per day",
  "admin.overview.chart.method.cash": "Cash",
  "admin.overview.chart.method.card": "Card",
  "admin.overview.chart.method.instapay": "InstaPay",
  "admin.overview.chart.method.deposit": "Deposit",
  "admin.overview.chart.method.whatsapp": "WhatsApp",
  "admin.overview.chart.method.other": "Other",
```

- [ ] **Step 2: Add matching Arabic keys**

In `src/lib/i18n/messages/admin/ar.ts`, find:

```ts
  "admin.overview.kpi.unreadChats": "محادثات غير مقروءة",
```

and change it to:

```ts
  "admin.overview.kpi.unreadChats": "محادثات غير مقروءة",
  "admin.overview.kpi.outstandingBalance": "الرصيد المستحق",
  "admin.overview.kpi.pendingPayments": "دفعات بانتظار المراجعة",
  "admin.overview.kpi.lowStock": "أصناف مخزون منخفض",
  "admin.overview.kpi.pendingApprovals": "بانتظار الاعتماد",
```

Find:

```ts
  "admin.overview.widget.myProductionWeek": "إنتاجي هذا الأسبوع",
```

and change it to:

```ts
  "admin.overview.widget.myProductionWeek": "إنتاجي هذا الأسبوع",
  "admin.overview.widget.chartBillingRevenue": "إيرادات الفواتير هذا الأسبوع",
  "admin.overview.widget.chartBillingMethodMix": "مزيج طرق الدفع",
  "admin.overview.widget.kpiOutstandingBalance": "الرصيد المستحق",
  "admin.overview.widget.kpiPendingPayments": "دفعات بانتظار المراجعة",
  "admin.overview.widget.chartInventoryStockValue": "قيمة المخزون حسب الفئة",
  "admin.overview.widget.chartInventoryConsumption": "استهلاك المخزون هذا الأسبوع",
  "admin.overview.widget.kpiLowStock": "أصناف مخزون منخفض",
  "admin.overview.widget.kpiPendingApprovals": "اعتمادات مخزون معلّقة",
```

Find:

```ts
  "admin.overview.chart.serviceRank": "ترتيب الخدمات",
  "admin.overview.chart.serviceRankDesc": "أكثر الخدمات حجزاً",
```

and change it to:

```ts
  "admin.overview.chart.serviceRank": "ترتيب الخدمات",
  "admin.overview.chart.serviceRankDesc": "أكثر الخدمات حجزاً",
  "admin.overview.chart.billingRevenue": "الإيرادات هذا الأسبوع",
  "admin.overview.chart.billingRevenueDesc": "الجنيهات المحصّلة يومياً",
  "admin.overview.chart.billingMethodMix": "مزيج طرق الدفع",
  "admin.overview.chart.billingMethodMixDesc": "حصة كل طريقة من إيرادات هذا الأسبوع",
  "admin.overview.chart.billingMethodMixEmpty": "لا توجد مدفوعات بعد.",
  "admin.overview.chart.inventoryStockValue": "قيمة المخزون حسب الفئة",
  "admin.overview.chart.inventoryStockValueDesc": "قيمة المخزون الحالي (جنيه) حسب الفئة",
  "admin.overview.chart.inventoryStockValueEmpty": "لا يوجد مخزون حالياً.",
  "admin.overview.chart.inventoryConsumption": "الاستهلاك هذا الأسبوع",
  "admin.overview.chart.inventoryConsumptionDesc": "تكلفة الاستهلاك (جنيه) يومياً",
  "admin.overview.chart.method.cash": "نقداً",
  "admin.overview.chart.method.card": "بطاقة",
  "admin.overview.chart.method.instapay": "إنستاباي",
  "admin.overview.chart.method.deposit": "وديعة",
  "admin.overview.chart.method.whatsapp": "واتساب",
  "admin.overview.chart.method.other": "أخرى",
```

- [ ] **Step 3: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors about missing/extra keys between `en.ts` and `ar.ts`. Errors may remain about `chartBillingRevenue` etc. not being valid `DashboardWidgetId` switch cases yet, or `ClinicDashboard`/`renderDashboardWidget` prop mismatches — resolved by Tasks 8–11.

- [ ] **Step 4: Commit**

```bash
git add src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts
git commit -m "feat(i18n): add billing/inventory overview widget strings (en + ar)"
```

---

### Task 8: Chart components

**Files:**
- Create: `src/features/admin/components/overview/DashboardBillingCharts.tsx`
- Create: `src/features/admin/components/overview/DashboardInventoryCharts.tsx`

**Interfaces:**
- Consumes: `WeekRevenuePoint`, `PaymentMethodMixItem` from `@/features/admin/lib/dashboardBillingStats` (Task 2); `CategoryStockValue` from `@/services/inventory/statsQueries` (Task 3), `InventoryWeekConsumptionPoint` from `@/features/admin/lib/dashboardInventoryStats` (Task 4); `CATEGORY_LABEL_KEYS` from `@/services/inventory/i18nMaps` (pre-existing); i18n keys from Task 7.
- Produces: `ChartBillingRevenue`, `ChartBillingMethodMix`, `ChartInventoryStockValue`, `ChartInventoryConsumption` React components. Consumed by Task 9 (`renderDashboardWidget.tsx`).

No unit tests for this task — these are presentational client components, verified visually in Task 12. Match the exact visual chrome (`admin-card`, `--admin-*` CSS vars, bar/donut treatment) of the existing `src/features/admin/components/overview/DashboardCharts.tsx`.

- [ ] **Step 1: Create the billing charts**

Create `src/features/admin/components/overview/DashboardBillingCharts.tsx`:

```tsx
"use client";

import type {
  PaymentMethodMixItem,
  WeekRevenuePoint,
} from "@/features/admin/lib/dashboardBillingStats";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

// Fixed categorical order, dataviz-skill-validated (adjacent CVD pass, light+dark):
// blue, orange, aqua, yellow, magenta, green (slots 1-6 of the documented 8-hue default).
const METHOD_COLOR: Record<string, string> = {
  cash: "#2a78d6",
  card: "#eb6834",
  instapay: "#1baf7a",
  deposit: "#eda100",
  whatsapp: "#e87ba4",
  other: "#008300",
};

const METHOD_LABEL: Record<string, AdminMessageKey> = {
  cash: "admin.overview.chart.method.cash",
  card: "admin.overview.chart.method.card",
  instapay: "admin.overview.chart.method.instapay",
  deposit: "admin.overview.chart.method.deposit",
  whatsapp: "admin.overview.chart.method.whatsapp",
  other: "admin.overview.chart.method.other",
};

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

export function ChartBillingRevenue({
  weekRevenue,
}: {
  weekRevenue: WeekRevenuePoint[];
}) {
  const t = useTranslations();
  const max = Math.max(...weekRevenue.map((item) => item.amount), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.billingRevenue")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.billingRevenueDesc")}
      </p>
      <div className="grid min-h-[12rem] min-w-0 flex-1 grid-cols-7 gap-2">
        {weekRevenue.map((item, index) => {
          const barPct = Math.max(
            item.amount === 0 ? 4 : 10,
            (item.amount / max) * 100,
          );
          return (
            <div
              key={`${item.label}-${index}`}
              className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto_auto] justify-items-center gap-1.5"
            >
              <div
                className="relative w-full min-h-0 self-stretch rounded-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-secondary) 12%, white)",
                }}
              >
                <div className="absolute inset-x-1.5 bottom-1.5 top-2 flex items-end">
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: `${barPct}%`,
                      background:
                        "linear-gradient(to top, color-mix(in srgb, var(--admin-secondary) 45%, white), var(--admin-secondary))",
                    }}
                    title={formatEgp(item.amount)}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--admin-muted)]">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-[var(--admin-text)]">
                {formatEgp(item.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ChartBillingMethodMix({
  methodMix,
}: {
  methodMix: PaymentMethodMixItem[];
}) {
  const t = useTranslations();
  const total = methodMix.reduce((sum, item) => sum + item.amount, 0) || 1;

  return (
    <section className="admin-card h-full min-h-0 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.billingMethodMix")}
      </h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.billingMethodMixDesc")}
      </p>
      {methodMix.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--admin-muted)]">
          {t("admin.overview.chart.billingMethodMixEmpty")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="mx-auto size-36 shrink-0 rounded-full"
            style={{ background: conicGradient(methodMix, total) }}
            role="img"
            aria-label={t("admin.overview.chart.billingMethodMix")}
          />
          <ul className="min-w-0 flex-1 space-y-2.5">
            {methodMix.map((item) => (
              <li
                key={item.method}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      background: METHOD_COLOR[item.method] ?? METHOD_COLOR.other,
                    }}
                  />
                  <span className="truncate text-[var(--admin-text)]">
                    {t(METHOD_LABEL[item.method] ?? METHOD_LABEL.other!)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--admin-text)]">
                  {formatEgp(item.amount)}
                  <span className="ms-1 font-normal text-[var(--admin-muted)]">
                    ({item.percent}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function conicGradient(
  methodMix: PaymentMethodMixItem[],
  total: number,
): string {
  let cursor = 0;
  const stops: string[] = [];
  for (const item of methodMix) {
    const start = cursor;
    cursor += (item.amount / total) * 360;
    const color = METHOD_COLOR[item.method] ?? METHOD_COLOR.other;
    stops.push(`${color} ${start.toFixed(1)}deg ${cursor.toFixed(1)}deg`);
  }
  if (stops.length === 0) return "#ECEEF3";
  return `conic-gradient(${stops.join(", ")})`;
}
```

- [ ] **Step 2: Create the inventory charts**

Create `src/features/admin/components/overview/DashboardInventoryCharts.tsx`:

```tsx
"use client";

import type { AnyMessageKey } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n";
import type { InventoryWeekConsumptionPoint } from "@/features/admin/lib/dashboardInventoryStats";
import type { CategoryStockValue } from "@/services/inventory/statsQueries";
import type { InventoryItemCategory } from "@/services/inventory/types";
import { CATEGORY_LABEL_KEYS } from "@/services/inventory/i18nMaps";

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

function categoryLabel(t: (key: AnyMessageKey) => string, category: string): string {
  const key = CATEGORY_LABEL_KEYS[category as InventoryItemCategory];
  return key ? t(key) : category;
}

export function ChartInventoryStockValue({
  stockValueByCategory,
}: {
  stockValueByCategory: CategoryStockValue[];
}) {
  const t = useTranslations();
  const rows = stockValueByCategory.slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.inventoryStockValue")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.inventoryStockValueDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.overview.chart.inventoryStockValueEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((item, index) => (
            <li key={item.category} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--admin-text)]">
                    {categoryLabel(t, item.category)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatEgp(item.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-primary)]"
                    style={{ width: `${(item.value / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ChartInventoryConsumption({
  weekConsumption,
}: {
  weekConsumption: InventoryWeekConsumptionPoint[];
}) {
  const t = useTranslations();
  const max = Math.max(...weekConsumption.map((item) => item.amount), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.inventoryConsumption")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.inventoryConsumptionDesc")}
      </p>
      <div className="grid min-h-[12rem] min-w-0 flex-1 grid-cols-7 gap-2">
        {weekConsumption.map((item, index) => {
          const barPct = Math.max(
            item.amount === 0 ? 4 : 10,
            (item.amount / max) * 100,
          );
          return (
            <div
              key={`${item.label}-${index}`}
              className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto_auto] justify-items-center gap-1.5"
            >
              <div
                className="relative w-full min-h-0 self-stretch rounded-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-primary) 10%, white)",
                }}
              >
                <div className="absolute inset-x-1.5 bottom-1.5 top-2 flex items-end">
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: `${barPct}%`,
                      background: "var(--admin-primary)",
                      opacity: item.amount === 0 ? 0.25 : 1,
                    }}
                    title={formatEgp(item.amount)}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--admin-muted)]">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-[var(--admin-text)]">
                {formatEgp(item.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors from these two new files (all their imports exist as of Tasks 1, 3, 4, 7).

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/components/overview/DashboardBillingCharts.tsx src/features/admin/components/overview/DashboardInventoryCharts.tsx
git commit -m "feat(overview): add billing and inventory chart components"
```

---

### Task 9: Wire charts + KPIs into `renderDashboardWidget` and `DashboardWidgetHost`

**Files:**
- Modify: `src/features/admin/components/overview/renderDashboardWidget.tsx`
- Modify: `src/features/admin/components/overview/DashboardWidgetHost.tsx`

**Interfaces:**
- Consumes: chart components from Task 8; `WeekRevenuePoint`/`PaymentMethodMixItem` (Task 2); `CategoryStockValue` (Task 3); `InventoryWeekConsumptionPoint` (Task 4).
- Produces: `BillingChartStats = { weekRevenue: WeekRevenuePoint[]; methodMix: PaymentMethodMixItem[] }`, `InventoryChartStats = { stockValueByCategory: CategoryStockValue[]; weekConsumption: InventoryWeekConsumptionPoint[] }` types (exported from `renderDashboardWidget.tsx`), and `DashboardWidgetRenderCtx.billingStats` / `.inventoryStats` fields. Consumed by Task 10 (`ClinicDashboard.tsx`) and Task 11 (`page.tsx`).

- [ ] **Step 1: Add imports and new ctx fields**

In `src/features/admin/components/overview/renderDashboardWidget.tsx`, change:

```tsx
import {
  ChartBookingMix,
  ChartBusyHours,
  ChartDayTrend,
  ChartStatusMix,
  ChartVisitsWeek,
} from "./DashboardCharts";
import {
  ChartCancelRate,
  ChartServiceRank,
  ChartWeekCompare,
} from "./DashboardExtraCharts";

export type DashboardWidgetRenderCtx = {
  reservations: Reservation[];
  coverageFrom: string;
  coverageTo: string;
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
  conversations: WhatsappConversation[];
  onPatientSelect: (reservation: Reservation) => void;
  emptyAttention: string;
  /** When false, message widgets stay on fixture rows (showreel). */
  conversationsLive?: boolean;
  /** Doctor's own fee total for the current week — null unless dashboard is doctor-scoped. */
  doctorProduction?: DoctorProduction | null;
};
```

to:

```tsx
import type {
  PaymentMethodMixItem,
  WeekRevenuePoint,
} from "@/features/admin/lib/dashboardBillingStats";
import type { InventoryWeekConsumptionPoint } from "@/features/admin/lib/dashboardInventoryStats";
import type { CategoryStockValue } from "@/services/inventory/statsQueries";
import {
  ChartBookingMix,
  ChartBusyHours,
  ChartDayTrend,
  ChartStatusMix,
  ChartVisitsWeek,
} from "./DashboardCharts";
import {
  ChartCancelRate,
  ChartServiceRank,
  ChartWeekCompare,
} from "./DashboardExtraCharts";
import {
  ChartBillingMethodMix,
  ChartBillingRevenue,
} from "./DashboardBillingCharts";
import {
  ChartInventoryConsumption,
  ChartInventoryStockValue,
} from "./DashboardInventoryCharts";

/** Chart data for the 2 billing widgets — null when the viewer lacks patients.view. */
export type BillingChartStats = {
  weekRevenue: WeekRevenuePoint[];
  methodMix: PaymentMethodMixItem[];
};

/** Chart data for the 2 inventory widgets — null when the viewer lacks inventory.view. */
export type InventoryChartStats = {
  stockValueByCategory: CategoryStockValue[];
  weekConsumption: InventoryWeekConsumptionPoint[];
};

export type DashboardWidgetRenderCtx = {
  reservations: Reservation[];
  coverageFrom: string;
  coverageTo: string;
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
  conversations: WhatsappConversation[];
  onPatientSelect: (reservation: Reservation) => void;
  emptyAttention: string;
  /** When false, message widgets stay on fixture rows (showreel). */
  conversationsLive?: boolean;
  /** Doctor's own fee total for the current week — null unless dashboard is doctor-scoped. */
  doctorProduction?: DoctorProduction | null;
  /** Billing chart data — null when the viewer lacks patients.view or the query failed. */
  billingStats?: BillingChartStats | null;
  /** Inventory chart data — null when the viewer lacks inventory.view or the query failed. */
  inventoryStats?: InventoryChartStats | null;
};
```

- [ ] **Step 2: Add the 4 new KPI mappings**

Change:

```tsx
const KPI_BY_WIDGET: Partial<
  Record<DashboardWidgetId, { labelKey: DashboardKpi["labelKey"]; icon: number }>
> = {
  kpiTodayVisits: { labelKey: "admin.overview.kpi.todayVisits", icon: 0 },
  kpiPending: { labelKey: "admin.overview.kpi.pending", icon: 1 },
  kpiConfirmedWeek: { labelKey: "admin.overview.kpi.confirmedWeek", icon: 2 },
  kpiServices: { labelKey: "admin.overview.kpi.services", icon: 3 },
  kpiCancelled: { labelKey: "admin.overview.kpi.cancelled", icon: 1 },
  kpiNoShow: { labelKey: "admin.overview.kpi.noShow", icon: 1 },
  kpiCompleted: { labelKey: "admin.overview.kpi.completed", icon: 2 },
  kpiTomorrow: { labelKey: "admin.overview.kpi.tomorrow", icon: 0 },
  kpiWeekTotal: { labelKey: "admin.overview.kpi.weekTotal", icon: 0 },
  kpiUnreadChats: { labelKey: "admin.overview.kpi.unreadChats", icon: 3 },
};
```

to:

```tsx
const KPI_BY_WIDGET: Partial<
  Record<DashboardWidgetId, { labelKey: DashboardKpi["labelKey"]; icon: number }>
> = {
  kpiTodayVisits: { labelKey: "admin.overview.kpi.todayVisits", icon: 0 },
  kpiPending: { labelKey: "admin.overview.kpi.pending", icon: 1 },
  kpiConfirmedWeek: { labelKey: "admin.overview.kpi.confirmedWeek", icon: 2 },
  kpiServices: { labelKey: "admin.overview.kpi.services", icon: 3 },
  kpiCancelled: { labelKey: "admin.overview.kpi.cancelled", icon: 1 },
  kpiNoShow: { labelKey: "admin.overview.kpi.noShow", icon: 1 },
  kpiCompleted: { labelKey: "admin.overview.kpi.completed", icon: 2 },
  kpiTomorrow: { labelKey: "admin.overview.kpi.tomorrow", icon: 0 },
  kpiWeekTotal: { labelKey: "admin.overview.kpi.weekTotal", icon: 0 },
  kpiUnreadChats: { labelKey: "admin.overview.kpi.unreadChats", icon: 3 },
  kpiOutstandingBalance: { labelKey: "admin.overview.kpi.outstandingBalance", icon: 3 },
  kpiPendingPayments: { labelKey: "admin.overview.kpi.pendingPayments", icon: 1 },
  kpiLowStock: { labelKey: "admin.overview.kpi.lowStock", icon: 1 },
  kpiPendingApprovals: { labelKey: "admin.overview.kpi.pendingApprovals", icon: 1 },
};
```

- [ ] **Step 3: Add the 4 new chart `switch` cases**

Change:

```tsx
    case "chartServiceRank":
      return <ChartServiceRank serviceMix={ctx.stats.serviceMix} />;
    case "myProductionWeek":
```

to:

```tsx
    case "chartServiceRank":
      return <ChartServiceRank serviceMix={ctx.stats.serviceMix} />;
    case "chartBillingRevenue":
      return ctx.billingStats ? (
        <ChartBillingRevenue weekRevenue={ctx.billingStats.weekRevenue} />
      ) : null;
    case "chartBillingMethodMix":
      return ctx.billingStats ? (
        <ChartBillingMethodMix methodMix={ctx.billingStats.methodMix} />
      ) : null;
    case "chartInventoryStockValue":
      return ctx.inventoryStats ? (
        <ChartInventoryStockValue
          stockValueByCategory={ctx.inventoryStats.stockValueByCategory}
        />
      ) : null;
    case "chartInventoryConsumption":
      return ctx.inventoryStats ? (
        <ChartInventoryConsumption
          weekConsumption={ctx.inventoryStats.weekConsumption}
        />
      ) : null;
    case "myProductionWeek":
```

- [ ] **Step 4: Thread the new ctx fields through `DashboardWidgetHost`**

In `src/features/admin/components/overview/DashboardWidgetHost.tsx`, change:

```tsx
import type { DoctorProduction } from "@/services/patient_treatments/queries";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { renderDashboardWidget } from "./renderDashboardWidget";

export type DashboardWidgetHostProps = {
  id: DashboardWidgetId;
  reservations: Reservation[];
  coverageFrom: string;
  coverageTo: string;
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
  conversations: WhatsappConversation[];
  onPatientSelect: (reservation: Reservation) => void;
  conversationsLive?: boolean;
  doctorProduction?: DoctorProduction | null;
  className?: string;
};
```

to:

```tsx
import type { DoctorProduction } from "@/services/patient_treatments/queries";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  renderDashboardWidget,
  type BillingChartStats,
  type InventoryChartStats,
} from "./renderDashboardWidget";

export type DashboardWidgetHostProps = {
  id: DashboardWidgetId;
  reservations: Reservation[];
  coverageFrom: string;
  coverageTo: string;
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
  conversations: WhatsappConversation[];
  onPatientSelect: (reservation: Reservation) => void;
  conversationsLive?: boolean;
  doctorProduction?: DoctorProduction | null;
  billingStats?: BillingChartStats | null;
  inventoryStats?: InventoryChartStats | null;
  className?: string;
};
```

(No change needed to the component body — it already spreads `...rest` into `renderDashboardWidget`, so the two new fields pass through automatically once they're in the props type.)

- [ ] **Step 5: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: remaining errors only in `ClinicDashboard.tsx`/`page.tsx` (not yet passing `billingStats`/`inventoryStats`/the 3rd `useDashboardLayoutEditor` argument) — resolved by Tasks 10–11.

- [ ] **Step 6: Commit**

```bash
git add src/features/admin/components/overview/renderDashboardWidget.tsx src/features/admin/components/overview/DashboardWidgetHost.tsx
git commit -m "feat(overview): wire billing/inventory charts and KPIs into the widget renderer"
```

---

### Task 10: `ClinicDashboard` — permission props, hidden-widget filtering, ctx threading

**Files:**
- Modify: `src/features/admin/components/overview/ClinicDashboard.tsx`

**Interfaces:**
- Consumes: `BillingChartStats`, `InventoryChartStats` types (Task 9); `DashboardWidgetId` type (existing); `hiddenWidgetIds` 3rd param of `useDashboardLayoutEditor` (Task 6).
- Produces: `ClinicDashboard` gains `canViewBilling`, `canViewInventory`, `billingStats`, `inventoryStats` props, all optional with fail-closed defaults (`false`/`false`/`null`/`null`) so the 5 showreel callers (`WhatsappScene.tsx`, `SiteToChatScene.tsx`, `DashboardScene.tsx`, `AiBookingScene.tsx`, `SmartUxScene.tsx`) keep working unchanged. Consumed by Task 11 (`page.tsx`).

- [ ] **Step 1: Update imports**

In `src/features/admin/components/overview/ClinicDashboard.tsx`, change:

```tsx
"use client";

import { useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { Reservation } from "@/services/reservations/types";
import type { ReservationStats } from "@/services/reservations/stats";
import type {
  AttentionItem,
  DashboardKpi,
} from "@/features/admin/lib/dashboardModel";
import type { Service } from "@/services/services/types";
import type { WhatsappConversation } from "@/services/whatsapp/types";
import type { SiteSettings } from "@/services/site_settings/types";
import type { DoctorProduction } from "@/services/patient_treatments/queries";
import { AdminReservationFilters } from "@/features/admin/components/AdminReservationFilters";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { useDashboardLayoutEditor } from "@/features/admin/hooks/useDashboardLayoutEditor";
import {
  colSpanClass,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  packDashboardStackRows,
  rowGapColSpan,
  type DashboardLayout,
} from "@/features/admin/lib/dashboardLayout";
```

to:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { Reservation } from "@/services/reservations/types";
import type { ReservationStats } from "@/services/reservations/stats";
import type {
  AttentionItem,
  DashboardKpi,
} from "@/features/admin/lib/dashboardModel";
import type { Service } from "@/services/services/types";
import type { WhatsappConversation } from "@/services/whatsapp/types";
import type { SiteSettings } from "@/services/site_settings/types";
import type { DoctorProduction } from "@/services/patient_treatments/queries";
import type {
  BillingChartStats,
  InventoryChartStats,
} from "./renderDashboardWidget";
import { AdminReservationFilters } from "@/features/admin/components/AdminReservationFilters";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { useDashboardLayoutEditor } from "@/features/admin/hooks/useDashboardLayoutEditor";
import {
  colSpanClass,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  packDashboardStackRows,
  rowGapColSpan,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/features/admin/lib/dashboardLayout";
```

- [ ] **Step 2: Add the new props**

Change:

```tsx
  /** True when the signed-in doctor's role has dashboard_scope "own" — reservations are already filtered to just them. */
  scopeToDoctor?: boolean;
  doctorProduction?: DoctorProduction | null;
};
```

to:

```tsx
  /** True when the signed-in doctor's role has dashboard_scope "own" — reservations are already filtered to just them. */
  scopeToDoctor?: boolean;
  doctorProduction?: DoctorProduction | null;
  /** Gates the 4 billing widgets — fails closed (defaults to hidden). */
  canViewBilling?: boolean;
  /** Gates the 4 inventory widgets — fails closed (defaults to hidden). */
  canViewInventory?: boolean;
  billingStats?: BillingChartStats | null;
  inventoryStats?: InventoryChartStats | null;
};
```

- [ ] **Step 3: Accept the new props, compute hidden widget ids, filter the initial layout**

Change:

```tsx
export function ClinicDashboard({
  email,
  displayName,
  avatarUrl = null,
  reservations,
  coverageFrom,
  coverageTo,
  services,
  attention,
  kpis,
  stats,
  conversations,
  settings,
  initialLayout,
  demoMode = false,
  demoClinical = null,
  scopeToDoctor = false,
  doctorProduction = null,
}: Props) {
  const [clinicReservation, setClinicReservation] =
    useState<Reservation | null>(null);
  const [filtering, setFiltering] = useState(false);
  const t = useTranslations();
  const reduced = useReducedMotion();
  const layoutTransition = dashboardLayoutTransition(reduced);
  const chromeTransition = dashboardEditChromeTransition(reduced);
  const slotVariants = dashboardEditSlotVariants(reduced);
  const editor = useDashboardLayoutEditor(settings, initialLayout);
  const stacks = groupDashboardStacks(editor.layout);
  const stackRows = packDashboardStackRows(stacks);
  const layoutActive = !reduced && !editor.dragFromId;

  const hostProps = {
    reservations,
    coverageFrom,
    coverageTo,
    services,
    attention,
    kpis,
    stats,
    conversations,
    onPatientSelect: setClinicReservation,
    conversationsLive: !demoMode,
    doctorProduction,
  };
```

to:

```tsx
export function ClinicDashboard({
  email,
  displayName,
  avatarUrl = null,
  reservations,
  coverageFrom,
  coverageTo,
  services,
  attention,
  kpis,
  stats,
  conversations,
  settings,
  initialLayout,
  demoMode = false,
  demoClinical = null,
  scopeToDoctor = false,
  doctorProduction = null,
  canViewBilling = false,
  canViewInventory = false,
  billingStats = null,
  inventoryStats = null,
}: Props) {
  const [clinicReservation, setClinicReservation] =
    useState<Reservation | null>(null);
  const [filtering, setFiltering] = useState(false);
  const t = useTranslations();
  const reduced = useReducedMotion();
  const layoutTransition = dashboardLayoutTransition(reduced);
  const chromeTransition = dashboardEditChromeTransition(reduced);
  const slotVariants = dashboardEditSlotVariants(reduced);
  const hiddenWidgetIds = useMemo<DashboardWidgetId[]>(() => {
    const hidden: DashboardWidgetId[] = [];
    if (!canViewBilling) {
      hidden.push(
        "chartBillingRevenue",
        "chartBillingMethodMix",
        "kpiOutstandingBalance",
        "kpiPendingPayments",
      );
    }
    if (!canViewInventory) {
      hidden.push(
        "chartInventoryStockValue",
        "chartInventoryConsumption",
        "kpiLowStock",
        "kpiPendingApprovals",
      );
    }
    return hidden;
  }, [canViewBilling, canViewInventory]);
  const visibleInitialLayout = useMemo(
    () => initialLayout.filter((w) => !hiddenWidgetIds.includes(w.id)),
    [initialLayout, hiddenWidgetIds],
  );
  const editor = useDashboardLayoutEditor(
    settings,
    visibleInitialLayout,
    hiddenWidgetIds,
  );
  const stacks = groupDashboardStacks(editor.layout);
  const stackRows = packDashboardStackRows(stacks);
  const layoutActive = !reduced && !editor.dragFromId;

  const hostProps = {
    reservations,
    coverageFrom,
    coverageTo,
    services,
    attention,
    kpis,
    stats,
    conversations,
    onPatientSelect: setClinicReservation,
    conversationsLive: !demoMode,
    doctorProduction,
    billingStats,
    inventoryStats,
  };
```

This means a viewer without `patients.view`/`inventory.view` never even sees these 8 ids in their layout, even if another admin already added one to the shared clinic layout in `site_settings.dashboard_layout` — `visibleInitialLayout` strips them before the editor ever sees them, and `hiddenWidgetIds` keeps them out of the "+ Add widget" catalog (via Task 6's `missingDashboardWidgets` change).

- [ ] **Step 4: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: remaining errors only in `page.tsx` (not yet passing the 4 new props) — resolved by Task 11.

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/components/overview/ClinicDashboard.tsx
git commit -m "feat(overview): gate billing/inventory widgets on canViewBilling/canViewInventory"
```

---

### Task 11: `page.tsx` — fetch billing/inventory data and wire it up

**Files:**
- Modify: `src/app/(internal)/admin/(dashboard)/(overview)/page.tsx`

**Interfaces:**
- Consumes: everything produced by Tasks 1–10.
- Produces: the finished feature — the overview page now fetches and threads billing/inventory data end to end.

- [ ] **Step 1: Add imports**

Change:

```tsx
import { createClient } from "@/lib/supabase/server";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import {
  buildAttentionItems,
  buildDashboardKpis,
  DASHBOARD_LIST_LIMIT,
  firstNameFromEmail,
} from "@/features/admin/lib/dashboardModel";
import { expandCoverageThroughAfterTomorrow } from "@/features/admin/lib/dayScheduleModel";
import {
  defaultOverviewFromTo,
  reservationFiltersCache,
  resolveReservationFilters,
} from "@/features/admin/lib/reservationFilters";
import { listReservationsServer } from "@/services/reservations/queries";
import { buildReservationStats } from "@/services/reservations/stats";
import { listConversations } from "@/services/whatsapp/queries";
import { listDoctorProductionThisWeek } from "@/services/patient_treatments/queries";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
} from "@/features/admin/lib/dashboardLayout";
```

to:

```tsx
import { createClient } from "@/lib/supabase/server";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import {
  buildAttentionItems,
  buildBillingInventoryKpis,
  buildDashboardKpis,
  DASHBOARD_LIST_LIMIT,
  firstNameFromEmail,
} from "@/features/admin/lib/dashboardModel";
import { expandCoverageThroughAfterTomorrow } from "@/features/admin/lib/dayScheduleModel";
import {
  defaultOverviewFromTo,
  reservationFiltersCache,
  resolveReservationFilters,
} from "@/features/admin/lib/reservationFilters";
import { listReservationsServer } from "@/services/reservations/queries";
import { buildReservationStats } from "@/services/reservations/stats";
import { listConversations } from "@/services/whatsapp/queries";
import { listDoctorProductionThisWeek } from "@/services/patient_treatments/queries";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { hasPermission } from "@/lib/auth/permissions";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
} from "@/features/admin/lib/dashboardLayout";
import {
  listPatientBalances,
  listWeekPayments,
  sumOutstandingBalance,
} from "@/services/patient_billing/queries";
import type {
  PatientBalance,
  WeekPaymentRow,
} from "@/services/patient_billing/types";
import {
  listPendingBillingPayments,
  type BillingPaymentQueueRow,
} from "@/services/billing_payments/queries";
import {
  countLowStockItems,
  countPendingApprovals,
  getStockValueByCategory,
  listWeekConsumptionRows,
  type CategoryStockValue,
  type WeekConsumptionRow,
} from "@/services/inventory/statsQueries";
import { buildBillingWeekRevenue, buildPaymentMethodMix } from "@/features/admin/lib/dashboardBillingStats";
import { buildWeekConsumptionChart } from "@/features/admin/lib/dashboardInventoryStats";
```

- [ ] **Step 2: Compute permission flags**

Change:

```tsx
  const session = await requirePagePermission("dashboard.view");
  const scopeToDoctor = session.isDoctor && session.dashboardScope === "own";
  const raw = await reservationFiltersCache.parse(searchParams);
```

to:

```tsx
  const session = await requirePagePermission("dashboard.view");
  const scopeToDoctor = session.isDoctor && session.dashboardScope === "own";
  const canViewBilling = hasPermission(session, "patients.view");
  const canViewInventory = hasPermission(session, "inventory.view");
  const raw = await reservationFiltersCache.parse(searchParams);
```

- [ ] **Step 3: Fetch billing/inventory data alongside the existing `Promise.all`**

Change:

```tsx
  const supabase = await createClient();
  const [
    { data: auth },
    reservations,
    servicesRes,
    conversations,
    settingsRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    listReservationsServer(supabase, listFilters).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    listConversations(supabase, {
      status: "open",
      sort: "newest",
      limit: DASHBOARD_LIST_LIMIT,
    }).catch(() => []),
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
  ]);

  let doctorProduction = null;
  if (scopeToDoctor) {
    const week = thisWeekRange();
    doctorProduction = await listDoctorProductionThisWeek(
      supabase,
      session.user!.id,
      week.from,
      week.to,
    ).catch(() => null);
  }
```

to:

```tsx
  const supabase = await createClient();
  const week = thisWeekRange();
  const [
    { data: auth },
    reservations,
    servicesRes,
    conversations,
    settingsRes,
    weekPayments,
    patientBalances,
    pendingBillingPayments,
    stockValueByCategory,
    weekConsumptionRows,
    lowStockCount,
    pendingApprovalsCount,
  ] = await Promise.all([
    supabase.auth.getUser(),
    listReservationsServer(supabase, listFilters).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    listConversations(supabase, {
      status: "open",
      sort: "newest",
      limit: DASHBOARD_LIST_LIMIT,
    }).catch(() => []),
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
    canViewBilling
      ? listWeekPayments(supabase, week.from, week.to).catch(() => [] as WeekPaymentRow[])
      : Promise.resolve([] as WeekPaymentRow[]),
    canViewBilling
      ? listPatientBalances(supabase).catch(() => [] as PatientBalance[])
      : Promise.resolve([] as PatientBalance[]),
    canViewBilling
      ? listPendingBillingPayments(supabase).catch(() => [] as BillingPaymentQueueRow[])
      : Promise.resolve([] as BillingPaymentQueueRow[]),
    canViewInventory
      ? getStockValueByCategory(supabase).catch(() => [] as CategoryStockValue[])
      : Promise.resolve([] as CategoryStockValue[]),
    canViewInventory
      ? listWeekConsumptionRows(supabase, week.from, week.to).catch(() => [] as WeekConsumptionRow[])
      : Promise.resolve([] as WeekConsumptionRow[]),
    canViewInventory
      ? countLowStockItems(supabase).catch(() => 0)
      : Promise.resolve(0),
    canViewInventory
      ? countPendingApprovals(supabase).catch(() => 0)
      : Promise.resolve(0),
  ]);

  let doctorProduction = null;
  if (scopeToDoctor) {
    doctorProduction = await listDoctorProductionThisWeek(
      supabase,
      session.user!.id,
      week.from,
      week.to,
    ).catch(() => null);
  }

  const billingStats = canViewBilling
    ? {
        weekRevenue: buildBillingWeekRevenue(weekPayments),
        methodMix: buildPaymentMethodMix(weekPayments),
      }
    : null;
  const inventoryStats = canViewInventory
    ? {
        stockValueByCategory,
        weekConsumption: buildWeekConsumptionChart(weekConsumptionRows),
      }
    : null;
```

- [ ] **Step 4: Merge the new KPIs and pass everything to `ClinicDashboard`**

Change:

```tsx
  const settings = settingsRes.data ?? null;
  const initialLayout = normalizeDashboardLayout(
    settings?.dashboard_layout ?? DEFAULT_DASHBOARD_LAYOUT,
  );

  return (
    <ClinicDashboard
      email={email}
      displayName={displayName}
      avatarUrl={profile?.avatar_url ?? null}
      reservations={reservations}
      coverageFrom={coverage.from}
      coverageTo={coverage.to}
      services={servicesRes.data ?? []}
      attention={buildAttentionItems(reservations)}
      kpis={buildDashboardKpis(reservations, publishedCount, unreadChats)}
      stats={stats}
      conversations={conversations}
      settings={settings}
      initialLayout={initialLayout}
      scopeToDoctor={scopeToDoctor}
      doctorProduction={doctorProduction}
    />
  );
}
```

to:

```tsx
  const settings = settingsRes.data ?? null;
  const initialLayout = normalizeDashboardLayout(
    settings?.dashboard_layout ?? DEFAULT_DASHBOARD_LAYOUT,
  );
  const kpis = [
    ...buildDashboardKpis(reservations, publishedCount, unreadChats),
    ...buildBillingInventoryKpis({
      outstandingBalance: canViewBilling
        ? sumOutstandingBalance(patientBalances)
        : null,
      pendingPaymentsCount: canViewBilling ? pendingBillingPayments.length : null,
      lowStockCount: canViewInventory ? lowStockCount : null,
      pendingApprovalsCount: canViewInventory ? pendingApprovalsCount : null,
    }),
  ];

  return (
    <ClinicDashboard
      email={email}
      displayName={displayName}
      avatarUrl={profile?.avatar_url ?? null}
      reservations={reservations}
      coverageFrom={coverage.from}
      coverageTo={coverage.to}
      services={servicesRes.data ?? []}
      attention={buildAttentionItems(reservations)}
      kpis={kpis}
      stats={stats}
      conversations={conversations}
      settings={settings}
      initialLayout={initialLayout}
      scopeToDoctor={scopeToDoctor}
      doctorProduction={doctorProduction}
      canViewBilling={canViewBilling}
      canViewInventory={canViewInventory}
      billingStats={billingStats}
      inventoryStats={inventoryStats}
    />
  );
}
```

- [ ] **Step 5: Typecheck**

Run: `GITHUB_TOKEN=x yarn typecheck`
Expected: no errors anywhere in the project.

- [ ] **Step 6: Run the full test suite**

Run: `bash scripts/test.sh`
Expected: PASS — every existing test plus all new tests from Tasks 1–6.

- [ ] **Step 7: Commit**

```bash
git add "src/app/(internal)/admin/(dashboard)/(overview)/page.tsx"
git commit -m "feat(overview): fetch and wire billing/inventory dashboard data"
```

---

### Task 12: Manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start the dev server**

Use the `run` skill (or `GITHUB_TOKEN=x yarn dev`) to start the app, and sign in at `/admin/login` with the credentials in `docs/LOCAL_SETUP.md` (`admin@dentallounge.local` / `DentalLounge2026!`). This account should hold both `patients.view` and `inventory.view`.

- [ ] **Step 2: Verify the 8 widgets are addable and render real data**

On `/admin`, click "Customize layout" → "Add widget". Confirm all 8 new entries appear in the catalog (2 billing charts, 2 billing KPIs, 2 inventory charts, 2 inventory KPIs — labels from Task 7's `admin.overview.widget.*` keys). Add each one, save the layout, and confirm:
- The revenue and consumption bar charts show a 7-column Mon–Sun grid with EGP-formatted values (create a manual charge/payment via `/admin/billing` or a patient's billing tab first if the week is otherwise empty, so the chart isn't all zeros).
- The payment-method donut renders with a legend showing method name, amount, and percent.
- The stock-value-by-category list is a ranked bar list with category names (via `CATEGORY_LABEL_KEYS`) and EGP values.
- The 4 KPI cards show a number/amount, with the "pending payments" / "low stock" / "pending approvals" cards showing red when their count is non-zero.

- [ ] **Step 3: Verify permission gating**

In Supabase, temporarily create (or reuse) a role with `dashboard.view` but neither `patients.view` nor `inventory.view`, sign in as a user with that role, and confirm:
- None of the 8 new widgets appear in the "+ Add widget" catalog.
- If the admin account's saved layout already included one of the 8 widgets (from Step 2), the restricted viewer's dashboard does not render it at all (no blank card).

Revert any temporary role/permission changes made for this check.

- [ ] **Step 4: Toggle Arabic and re-check labels**

Switch the admin UI to Arabic (locale toggle) and confirm every new widget title, KPI label, chart title/description, payment-method name, and category name renders in Arabic with no raw key strings (e.g. no literal `admin.overview.chart.method.cash` text visible anywhere).

- [ ] **Step 5: Final report**

Summarize pass/fail for Steps 2–4. If anything fails, fix it in the relevant task's files, re-run `bash scripts/test.sh` and `GITHUB_TOKEN=x yarn typecheck`, and re-verify before considering the feature done.
