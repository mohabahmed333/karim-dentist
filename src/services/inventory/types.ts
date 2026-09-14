import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Supplier = Tables<"suppliers">;
export type SupplierInsert = TablesInsert<"suppliers">;
export type SupplierUpdate = TablesUpdate<"suppliers">;

export type InventoryItem = Tables<"inventory_items">;
export type InventoryItemInsert = TablesInsert<"inventory_items">;
export type InventoryItemUpdate = TablesUpdate<"inventory_items">;
export type InventoryItemCategory = InventoryItem["category"];
export type InventoryItemUnit = InventoryItem["unit"];

export type InventoryBatch = Tables<"inventory_batches">;
export type InventoryBatchInsert = TablesInsert<"inventory_batches">;

export type ServiceRecipe = Tables<"service_recipes">;
export type ServiceRecipeInsert = TablesInsert<"service_recipes">;
export type RecipeKind = ServiceRecipe["kind"];

export type InventoryTransaction = Tables<"inventory_transactions">;
export type InventoryTransactionType = InventoryTransaction["type"];
export type InventoryApprovalStatus = InventoryTransaction["approval_status"];
export type WastageReasonCode = NonNullable<InventoryTransaction["reason_code"]>;

export const WASTAGE_REASON_CODES: WastageReasonCode[] = [
  "dropped_contaminated",
  "expired",
  "damaged_packaging",
  "patient_no_show_opened",
  "equipment_failure",
  "recount_correction",
  "received_shipment",
  "returned_to_supplier",
  "other",
];

export type InventorySettings = Tables<"inventory_settings">;
export type InventoryAlertsMode = InventorySettings["mode"];

export type InventoryAlert = Tables<"inventory_alerts">;

/** One line item a doctor confirms at appointment completion. */
export type ConsumableUsage = { item_id: string; qty_used: number };

/** A service_recipes row joined with the item it points at, for the checkout UI. */
export type ServiceRecipeWithItem = ServiceRecipe & {
  item: Pick<InventoryItem, "id" | "name" | "name_ar" | "unit">;
};
