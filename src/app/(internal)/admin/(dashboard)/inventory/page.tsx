import { InventoryManager } from "@/features/admin/components/inventory/InventoryManager";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminInventoryPage() {
  await requirePagePermission("inventory.view");
  const supabase = await createClient();

  const [{ data: items }, { data: batches }, { data: suppliers }] = await Promise.all([
    supabase.from("inventory_items").select("*").is("deleted_at", null).order("name", { ascending: true }),
    supabase.from("inventory_batches").select("item_id, qty_remaining"),
    supabase.from("suppliers").select("*").is("deleted_at", null).order("name", { ascending: true }),
  ]);

  const onHandByItem = new Map<string, number>();
  for (const row of batches ?? []) {
    onHandByItem.set(row.item_id, (onHandByItem.get(row.item_id) ?? 0) + row.qty_remaining);
  }
  const itemsWithStock = (items ?? []).map((item) => ({
    ...item,
    qty_on_hand: onHandByItem.get(item.id) ?? 0,
  }));

  return <InventoryManager initialItems={itemsWithStock} initialSuppliers={suppliers ?? []} />;
}
