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
