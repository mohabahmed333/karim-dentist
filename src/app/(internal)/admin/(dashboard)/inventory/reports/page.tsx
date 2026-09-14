import { InventoryReportsView, type VarianceRow } from "@/features/admin/components/inventory/InventoryReportsView";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminInventoryReportsPage() {
  await requirePagePermission("inventory.reports.view");
  const supabase = await createClient();

  const [{ data: pendingRaw }, { data: items }, { data: fixedRecipes }, { data: doneTreatments }, { data: actualTxns }] =
    await Promise.all([
      supabase
        .from("inventory_transactions")
        .select("*")
        .eq("approval_status", "pending_review")
        .order("created_at", { ascending: true }),
      supabase.from("inventory_items").select("id, name, unit").is("deleted_at", null),
      supabase.from("service_recipes").select("service_id, item_id, default_qty").eq("kind", "fixed"),
      supabase.from("patient_treatments").select("service_id").eq("status", "done").not("service_id", "is", null),
      supabase.from("inventory_transactions").select("item_id, qty").in("type", ["consumption", "wastage"]),
    ]);

  const itemNameById = new Map((items ?? []).map((i) => [i.id, { name: i.name, unit: i.unit }]));

  const pending = (pendingRaw ?? []).map((row) => ({
    ...row,
    item_name: itemNameById.get(row.item_id)?.name ?? "Unknown item",
  }));

  const doneCountByService = new Map<string, number>();
  for (const row of doneTreatments ?? []) {
    if (!row.service_id) continue;
    doneCountByService.set(row.service_id, (doneCountByService.get(row.service_id) ?? 0) + 1);
  }

  const expectedByItem = new Map<string, number>();
  for (const recipe of fixedRecipes ?? []) {
    const count = doneCountByService.get(recipe.service_id) ?? 0;
    if (count === 0) continue;
    expectedByItem.set(recipe.item_id, (expectedByItem.get(recipe.item_id) ?? 0) + count * recipe.default_qty);
  }

  const actualByItem = new Map<string, number>();
  for (const row of actualTxns ?? []) {
    actualByItem.set(row.item_id, (actualByItem.get(row.item_id) ?? 0) + row.qty);
  }

  const itemIds = new Set([...expectedByItem.keys(), ...actualByItem.keys()]);
  const variance: VarianceRow[] = [...itemIds]
    .map((item_id) => {
      const expected = Math.round((expectedByItem.get(item_id) ?? 0) * 100) / 100;
      const actual = Math.round((actualByItem.get(item_id) ?? 0) * 100) / 100;
      return {
        item_id,
        item_name: itemNameById.get(item_id)?.name ?? "Unknown item",
        unit: itemNameById.get(item_id)?.unit ?? "unit",
        expected_qty: expected,
        actual_qty: actual,
        unexplained_variance: Math.round((actual - expected) * 100) / 100,
      };
    })
    .filter((row) => Math.abs(row.unexplained_variance) > 0)
    .sort((a, b) => Math.abs(b.unexplained_variance) - Math.abs(a.unexplained_variance));

  return <InventoryReportsView initialPending={pending} variance={variance} />;
}
