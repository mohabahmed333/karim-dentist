import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type {
  AdjustmentFormValues,
  ItemFormValues,
  RecipeFormValues,
  RestockFormValues,
  SupplierFormValues,
  WastageFormValues,
} from "./schemas";
import type {
  ConsumableUsage,
  InventoryBatch,
  InventoryItem,
  InventoryTransaction,
  ServiceRecipe,
  Supplier,
} from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function createSupplier(
  supabase: AnySupabase,
  input: SupplierFormValues,
): Promise<Supplier> {
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: input.name,
      contact_name: input.contact_name,
      phone: input.phone,
      whatsapp_phone: input.whatsapp_phone || null,
      email: input.email || null,
      notes: input.notes,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateSupplier(
  supabase: AnySupabase,
  id: string,
  input: SupplierFormValues,
): Promise<Supplier> {
  const { data, error } = await supabase
    .from("suppliers")
    .update({
      name: input.name,
      contact_name: input.contact_name,
      phone: input.phone,
      whatsapp_phone: input.whatsapp_phone || null,
      email: input.email || null,
      notes: input.notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function archiveSupplier(supabase: AnySupabase, id: string): Promise<void> {
  const { error } = await supabase
    .from("suppliers")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function createItem(
  supabase: AnySupabase,
  input: ItemFormValues,
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      name: input.name,
      name_ar: input.name_ar,
      sku: input.sku || null,
      category: input.category,
      unit: input.unit,
      tracks_batches: input.tracks_batches,
      min_stock_level: input.min_stock_level,
      reorder_qty: input.reorder_qty,
      default_supplier_id: input.default_supplier_id || null,
      last_unit_cost_egp: input.last_unit_cost_egp ?? null,
      wastage_approval_threshold_egp: input.wastage_approval_threshold_egp ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(
  supabase: AnySupabase,
  id: string,
  input: ItemFormValues,
): Promise<InventoryItem> {
  const { data, error } = await supabase
    .from("inventory_items")
    .update({
      name: input.name,
      name_ar: input.name_ar,
      sku: input.sku || null,
      category: input.category,
      unit: input.unit,
      tracks_batches: input.tracks_batches,
      min_stock_level: input.min_stock_level,
      reorder_qty: input.reorder_qty,
      default_supplier_id: input.default_supplier_id || null,
      last_unit_cost_egp: input.last_unit_cost_egp ?? null,
      wastage_approval_threshold_egp: input.wastage_approval_threshold_egp ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function archiveItem(supabase: AnySupabase, id: string): Promise<void> {
  const { error } = await supabase
    .from("inventory_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Service recipes
// ---------------------------------------------------------------------------

export async function upsertRecipe(
  supabase: AnySupabase,
  input: RecipeFormValues,
): Promise<ServiceRecipe> {
  const { data, error } = await supabase
    .from("service_recipes")
    .upsert(
      {
        service_id: input.service_id,
        item_id: input.item_id,
        kind: input.kind,
        default_qty: input.default_qty,
        is_required: input.is_required,
        notes: input.notes,
      },
      { onConflict: "service_id,item_id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteRecipe(
  supabase: AnySupabase,
  serviceId: string,
  itemId: string,
): Promise<void> {
  const { error } = await supabase
    .from("service_recipes")
    .delete()
    .eq("service_id", serviceId)
    .eq("item_id", itemId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Restock / adjustment — new batches, not a FEFO draw, so these are plain
// inserts rather than the consume_inventory_stock RPC.
// ---------------------------------------------------------------------------

export async function restock(
  supabase: AnySupabase,
  input: RestockFormValues,
  createdBy: string,
): Promise<{ batch: InventoryBatch; transaction: InventoryTransaction }> {
  const { data: batch, error: batchError } = await supabase
    .from("inventory_batches")
    .insert({
      item_id: input.item_id,
      supplier_id: input.supplier_id || null,
      lot_number: input.lot_number || null,
      expires_on: input.expires_on || null,
      qty_received: input.qty_received,
      qty_remaining: input.qty_received,
      unit_cost_egp: input.unit_cost_egp,
    })
    .select("*")
    .single();
  if (batchError) throw batchError;

  const { data: transaction, error: txnError } = await supabase
    .from("inventory_transactions")
    .insert({
      item_id: input.item_id,
      batch_id: batch.id,
      type: "restock",
      qty: input.qty_received,
      unit_cost_egp: input.unit_cost_egp,
      reason_code: "received_shipment",
      reason_note: input.lot_number ? `Lot ${input.lot_number}` : "",
      created_by: createdBy,
    })
    .select("*")
    .single();
  if (txnError) throw txnError;

  if (input.unit_cost_egp > 0) {
    await supabase
      .from("inventory_items")
      .update({ last_unit_cost_egp: input.unit_cost_egp, updated_at: new Date().toISOString() })
      .eq("id", input.item_id);
  }

  return { batch, transaction };
}

/** A positive adjustment (recount found more than the ledger says) opens a
 * new synthetic batch, same as a restock with no supplier/lot. A negative
 * adjustment draws down through consume_inventory_stock so it FEFO-locks a
 * real batch instead of guessing which one to touch — see
 * 20260915200000_inventory_adjustment_draws.sql. */
export async function recordAdjustment(
  supabase: AnySupabase,
  input: AdjustmentFormValues,
  createdBy: string,
): Promise<InventoryTransaction[]> {
  if (input.qty_delta > 0) {
    const { data: batch, error: batchError } = await supabase
      .from("inventory_batches")
      .insert({
        item_id: input.item_id,
        qty_received: input.qty_delta,
        qty_remaining: input.qty_delta,
        unit_cost_egp: 0,
      })
      .select("*")
      .single();
    if (batchError) throw batchError;

    const { data: transaction, error: txnError } = await supabase
      .from("inventory_transactions")
      .insert({
        item_id: input.item_id,
        batch_id: batch.id,
        type: "adjustment",
        qty: input.qty_delta,
        reason_code: "recount_correction",
        reason_note: input.reason_note,
        created_by: createdBy,
      })
      .select("*")
      .single();
    if (txnError) throw txnError;
    return [transaction];
  }

  const { data, error } = await supabase.rpc("consume_inventory_stock", {
    p_item_id: input.item_id,
    p_qty: Math.abs(input.qty_delta),
    p_type: "adjustment",
    p_reason_code: "recount_correction",
    p_reason_note: input.reason_note,
    p_reservation_id: null,
    p_patient_treatment_id: null,
    p_deduction_group_id: crypto.randomUUID(),
    p_created_by: createdBy,
    p_photo_url: null,
  });
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Wastage — mandatory reason code, structurally cannot touch
// patient_billing_entries (consume_inventory_stock takes no patient key at
// all). Dual control (pending_review) is decided server-side by the RPC.
// ---------------------------------------------------------------------------

export async function logWastage(
  supabase: AnySupabase,
  input: WastageFormValues,
  createdBy: string,
): Promise<InventoryTransaction[]> {
  const { data, error } = await supabase.rpc("consume_inventory_stock", {
    p_item_id: input.item_id,
    p_qty: input.qty,
    p_type: "wastage",
    p_reason_code: input.reason_code,
    p_reason_note: input.reason_note,
    p_reservation_id: null,
    p_patient_treatment_id: null,
    p_deduction_group_id: crypto.randomUUID(),
    p_created_by: createdBy,
    p_photo_url: input.photo_url || null,
  });
  if (error) throw error;
  return data ?? [];
}

export async function approveWastageTransaction(
  supabase: AnySupabase,
  transactionId: string,
  decision: "confirmed" | "rejected",
  note: string,
): Promise<InventoryTransaction> {
  const { data, error } = await supabase.rpc("approve_inventory_transaction", {
    p_transaction_id: transactionId,
    p_decision: decision,
    p_note: note,
  });
  if (error) throw error;
  return data as unknown as InventoryTransaction;
}

// ---------------------------------------------------------------------------
// Completion-time deduction — shared by
// src/services/reservations/mutations.ts#completeReservation and
// src/services/patient_treatments/mutations.ts#completeTreatment. Draws
// every fixed recipe row (silent, default_qty) and every variable recipe
// row (from the caller-supplied usages, already validated to be present and
// positive by the actions.ts layer) under one deduction_group_id.
// ---------------------------------------------------------------------------

export async function deductRecipeForCompletion(
  supabase: AnySupabase,
  input: {
    serviceId: string;
    reservationId: string | null;
    patientTreatmentId: string | null;
    usages: ConsumableUsage[];
    createdBy: string;
  },
): Promise<InventoryTransaction[]> {
  const { data: recipes, error: recipesError } = await supabase
    .from("service_recipes")
    .select("*")
    .eq("service_id", input.serviceId);
  if (recipesError) throw recipesError;
  if (!recipes || recipes.length === 0) return [];

  const usageByItem = new Map(input.usages.map((u) => [u.item_id, u.qty_used]));
  const deductionGroupId = crypto.randomUUID();
  const results: InventoryTransaction[] = [];

  for (const recipe of recipes) {
    const qty = recipe.kind === "variable" ? usageByItem.get(recipe.item_id) : recipe.default_qty;
    if (recipe.kind === "variable" && (!qty || qty <= 0)) {
      // Server-side backstop: the actions.ts layer should already have
      // rejected a missing/zero variable usage before this runs, but a
      // direct call here must not silently skip the deduction either.
      throw new Error(
        `Missing quantity for a required consumable on this service (item ${recipe.item_id})`,
      );
    }
    if (!qty || qty <= 0) continue;

    const { data, error } = await supabase.rpc("consume_inventory_stock", {
      p_item_id: recipe.item_id,
      p_qty: qty,
      p_type: "consumption",
      p_reason_code: null,
      p_reason_note: "",
      p_reservation_id: input.reservationId,
      p_patient_treatment_id: input.patientTreatmentId,
      p_deduction_group_id: deductionGroupId,
      p_created_by: input.createdBy,
      p_photo_url: null,
    });
    if (error) throw error;
    results.push(...(data ?? []));
  }
  return results;
}
