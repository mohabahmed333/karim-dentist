import { createClient } from "@/lib/supabase/client";
import type {
  InventoryAlert,
  InventoryBatch,
  InventoryItem,
  InventoryTransaction,
  ServiceRecipeWithItem,
  Supplier,
} from "./types";

export async function listSuppliers(): Promise<Supplier[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listItems(): Promise<InventoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getItem(id: string): Promise<InventoryItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Stock on hand is always live SUM(qty_remaining), never a stored counter —
 * matching this codebase's stated preference for computing derived totals
 * live (see patient_billing_entries' migration comment). */
export async function getStockOnHand(itemId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("qty_remaining")
    .eq("item_id", itemId);
  if (error) throw error;
  return (data ?? []).reduce((sum, row) => sum + row.qty_remaining, 0);
}

export async function listBatchesForItem(itemId: string): Promise<InventoryBatch[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_batches")
    .select("*")
    .eq("item_id", itemId)
    .order("expires_on", { ascending: true, nullsFirst: false })
    .order("received_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listTransactionsForItem(
  itemId: string,
  limit = 50,
): Promise<InventoryTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("item_id", itemId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function listItemsBelowThreshold(): Promise<
  (InventoryItem & { qty_on_hand: number })[]
> {
  const supabase = createClient();
  const [{ data: items, error: itemsError }, { data: batches, error: batchesError }] =
    await Promise.all([
      supabase
        .from("inventory_items")
        .select("*")
        .is("deleted_at", null)
        .gt("min_stock_level", 0),
      supabase.from("inventory_batches").select("item_id, qty_remaining"),
    ]);
  if (itemsError) throw itemsError;
  if (batchesError) throw batchesError;

  const onHandByItem = new Map<string, number>();
  for (const row of batches ?? []) {
    onHandByItem.set(row.item_id, (onHandByItem.get(row.item_id) ?? 0) + row.qty_remaining);
  }
  return (items ?? [])
    .map((item) => ({ ...item, qty_on_hand: onHandByItem.get(item.id) ?? 0 }))
    .filter((item) => item.qty_on_hand <= item.min_stock_level);
}

/** Recipes for one service, joined with the item name/unit the checkout UI
 * needs to render. Zero rows means the service consumes nothing tracked —
 * see the table comment in 20260915160000_service_recipes.sql for why that
 * is NOT the same "empty = wildcard" reading service_doctors uses. */
export async function listRecipesForService(
  serviceId: string,
): Promise<ServiceRecipeWithItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_recipes")
    .select("*, item:inventory_items(id, name, name_ar, unit)")
    .eq("service_id", serviceId);
  if (error) throw error;
  return (data ?? []) as unknown as ServiceRecipeWithItem[];
}

export async function listRecipesForItem(itemId: string): Promise<ServiceRecipeWithItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("service_recipes")
    .select("*, item:inventory_items(id, name, name_ar, unit)")
    .eq("item_id", itemId);
  if (error) throw error;
  return (data ?? []) as unknown as ServiceRecipeWithItem[];
}

export async function listPendingApprovals(): Promise<InventoryTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_transactions")
    .select("*")
    .eq("approval_status", "pending_review")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listRecentAlerts(limit = 50): Promise<InventoryAlert[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inventory_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
