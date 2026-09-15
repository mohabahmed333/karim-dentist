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

export type ExpiringBatch = {
  batchId: string;
  itemName: string;
  itemNameAr: string;
  qtyRemaining: number;
  expiresOn: string;
  daysUntilExpiry: number;
};

/** Whole days from `now` until `isoDate`, floored at 0 for a date already past. */
export function daysUntil(isoDate: string, now = new Date()): number {
  const ms = new Date(isoDate).getTime() - now.getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

/** Batches with stock left, expiring within `withinDays` (default 30), soonest first. */
export async function listExpiringSoonBatches(
  supabase: ServerSupabase,
  now = new Date(),
  withinDays = 30,
): Promise<ExpiringBatch[]> {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + withinDays);
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("id, qty_remaining, expires_on, item:inventory_items(name, name_ar)")
    .gt("qty_remaining", 0)
    .not("expires_on", "is", null)
    .lte("expires_on", cutoff.toISOString())
    .order("expires_on", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    batchId: row.id,
    itemName: row.item?.name ?? "",
    itemNameAr: row.item?.name_ar ?? "",
    qtyRemaining: row.qty_remaining,
    expiresOn: row.expires_on!,
    daysUntilExpiry: daysUntil(row.expires_on!, now),
  }));
}

export type ReorderSuggestion = {
  itemId: string;
  itemName: string;
  itemNameAr: string;
  qtyOnHand: number;
  minStockLevel: number;
  reorderQty: number;
  supplierName: string | null;
};

type ReorderItemRow = {
  id: string;
  name: string;
  name_ar: string;
  min_stock_level: number;
  reorder_qty: number;
  default_supplier: { name: string } | null;
};
type ReorderBatchRow = { item_id: string; qty_remaining: number };

/** Items at/below their minimum stock level, with on-hand qty and a suggested reorder amount — pure, no I/O. */
export function buildReorderSuggestions(
  items: ReorderItemRow[],
  batches: ReorderBatchRow[],
): ReorderSuggestion[] {
  const onHand = new Map<string, number>();
  for (const batch of batches) {
    onHand.set(batch.item_id, (onHand.get(batch.item_id) ?? 0) + batch.qty_remaining);
  }
  return items
    .filter((item) => item.min_stock_level > 0)
    .map((item) => ({ item, qtyOnHand: onHand.get(item.id) ?? 0 }))
    .filter(({ item, qtyOnHand }) => qtyOnHand <= item.min_stock_level)
    .map(({ item, qtyOnHand }) => ({
      itemId: item.id,
      itemName: item.name,
      itemNameAr: item.name_ar,
      qtyOnHand,
      minStockLevel: item.min_stock_level,
      reorderQty: item.reorder_qty,
      supplierName: item.default_supplier?.name ?? null,
    }));
}

/** Items at/below their minimum stock level, clinic-wide, with a suggested reorder quantity. */
export async function listReorderSuggestions(
  supabase: ServerSupabase,
): Promise<ReorderSuggestion[]> {
  const [itemsRes, batchesRes] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("id, name, name_ar, min_stock_level, reorder_qty, default_supplier:suppliers(name)")
      .is("deleted_at", null)
      .gt("min_stock_level", 0),
    supabase.from("inventory_batches").select("item_id, qty_remaining"),
  ]);
  if (itemsRes.error) throw itemsRes.error;
  if (batchesRes.error) throw batchesRes.error;
  return buildReorderSuggestions(
    (itemsRes.data ?? []) as unknown as ReorderItemRow[],
    batchesRes.data ?? [],
  );
}

export type TopConsumedItem = { itemId: string; itemName: string; itemNameAr: string; cost: number };

type ConsumptionItemRow = {
  item_id: string;
  total_cost_egp: number;
  item: { name: string; name_ar: string } | null;
};

/** Sums consumption cost per item, highest first — pure, no I/O. */
export function aggregateTopConsumedItems(rows: ConsumptionItemRow[]): TopConsumedItem[] {
  const totals = new Map<string, { cost: number; name: string; nameAr: string }>();
  for (const row of rows) {
    const existing = totals.get(row.item_id);
    const name = row.item?.name ?? "";
    const nameAr = row.item?.name_ar ?? "";
    totals.set(row.item_id, {
      cost: (existing?.cost ?? 0) + row.total_cost_egp,
      name: existing?.name ?? name,
      nameAr: existing?.nameAr ?? nameAr,
    });
  }
  return [...totals.entries()]
    .map(([itemId, v]) => ({ itemId, itemName: v.name, itemNameAr: v.nameAr, cost: v.cost }))
    .sort((a, b) => b.cost - a.cost);
}

/** Items consumed (type='consumption') in an inclusive ISO date range, ranked by cost. */
export async function listTopConsumedItems(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<TopConsumedItem[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("item_id, total_cost_egp, item:inventory_items(name, name_ar)")
    .eq("type", "consumption")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw error;
  return aggregateTopConsumedItems((data ?? []) as unknown as ConsumptionItemRow[]);
}

export type WastageByReason = { reasonCode: string; cost: number };

type WastageRow = { reason_code: string | null; total_cost_egp: number };

/** Sums wastage cost per reason code, highest first, missing code bucketed as "other" — pure, no I/O. */
export function aggregateWastageByReason(rows: WastageRow[]): WastageByReason[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const code = row.reason_code ?? "other";
    totals.set(code, (totals.get(code) ?? 0) + row.total_cost_egp);
  }
  return [...totals.entries()]
    .map(([reasonCode, cost]) => ({ reasonCode, cost }))
    .sort((a, b) => b.cost - a.cost);
}

/** Wastage (type='wastage') in an inclusive ISO date range, ranked by reason. */
export async function listWastageByReason(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<WastageByReason[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("reason_code, total_cost_egp")
    .eq("type", "wastage")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw error;
  return aggregateWastageByReason(data ?? []);
}

export type SupplierSpend = { supplierId: string; supplierName: string | null; cost: number };

type RestockRow = {
  total_cost_egp: number;
  batch: { supplier_id: string | null; supplier: { name: string } | null } | null;
};

/** Sums restock cost per supplier, highest first — a missing/deleted supplier groups as "unknown" — pure, no I/O. */
export function aggregateSupplierSpend(rows: RestockRow[]): SupplierSpend[] {
  const totals = new Map<string, { cost: number; name: string | null }>();
  for (const row of rows) {
    const supplierId = row.batch?.supplier_id ?? "unknown";
    const existing = totals.get(supplierId);
    totals.set(supplierId, {
      cost: (existing?.cost ?? 0) + row.total_cost_egp,
      name: existing?.name ?? row.batch?.supplier?.name ?? null,
    });
  }
  return [...totals.entries()]
    .map(([supplierId, v]) => ({ supplierId, supplierName: v.name, cost: v.cost }))
    .sort((a, b) => b.cost - a.cost);
}

/** Restock spend (type='restock') in an inclusive ISO date range, ranked by supplier. Joins the batch's actual supplier — not an item's default reorder supplier, which can differ. */
export async function listSupplierSpend(
  supabase: ServerSupabase,
  from: string,
  to: string,
): Promise<SupplierSpend[]> {
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("total_cost_egp, batch:inventory_batches(supplier_id, supplier:suppliers(name))")
    .eq("type", "restock")
    .gte("created_at", from)
    .lte("created_at", to);
  if (error) throw error;
  return aggregateSupplierSpend((data ?? []) as unknown as RestockRow[]);
}
