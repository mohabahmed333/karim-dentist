"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import {
  adjustmentFormSchema,
  approveWastageSchema,
  itemFormSchema,
  recipeFormSchema,
  restockFormSchema,
  supplierFormSchema,
  wastageFormSchema,
} from "./schemas";
import * as mutations from "./mutations";
import type {
  InventoryItem,
  InventoryTransaction,
  ServiceRecipe,
  Supplier,
} from "./types";

export async function createSupplier(raw: unknown): Promise<Supplier> {
  const auth = await requirePermission("inventory.suppliers.manage");
  if (auth.error) throw new Error("Forbidden");
  const parsed = supplierFormSchema.parse(raw);
  return mutations.createSupplier(auth.supabase, parsed);
}

export async function updateSupplier(id: string, raw: unknown): Promise<Supplier> {
  const auth = await requirePermission("inventory.suppliers.manage");
  if (auth.error) throw new Error("Forbidden");
  const parsed = supplierFormSchema.parse(raw);
  return mutations.updateSupplier(auth.supabase, id, parsed);
}

export async function archiveSupplier(id: string): Promise<void> {
  const auth = await requirePermission("inventory.suppliers.manage");
  if (auth.error) throw new Error("Forbidden");
  return mutations.archiveSupplier(auth.supabase, id);
}

export async function createItem(raw: unknown): Promise<InventoryItem> {
  const auth = await requirePermission("inventory.items.manage");
  if (auth.error) throw new Error("Forbidden");
  const parsed = itemFormSchema.parse(raw);
  return mutations.createItem(auth.supabase, parsed);
}

export async function updateItem(id: string, raw: unknown): Promise<InventoryItem> {
  const auth = await requirePermission("inventory.items.manage");
  if (auth.error) throw new Error("Forbidden");
  const parsed = itemFormSchema.parse(raw);
  return mutations.updateItem(auth.supabase, id, parsed);
}

export async function archiveItem(id: string): Promise<void> {
  const auth = await requirePermission("inventory.items.manage");
  if (auth.error) throw new Error("Forbidden");
  return mutations.archiveItem(auth.supabase, id);
}

export async function upsertRecipe(raw: unknown): Promise<ServiceRecipe> {
  const auth = await requirePermission("inventory.recipes.manage");
  if (auth.error) throw new Error("Forbidden");
  const parsed = recipeFormSchema.parse(raw);
  return mutations.upsertRecipe(auth.supabase, parsed);
}

export async function deleteRecipe(serviceId: string, itemId: string): Promise<void> {
  const auth = await requirePermission("inventory.recipes.manage");
  if (auth.error) throw new Error("Forbidden");
  return mutations.deleteRecipe(auth.supabase, serviceId, itemId);
}

export async function restock(raw: unknown) {
  const auth = await requirePermission("inventory.restock");
  if (auth.error) throw new Error("Forbidden");
  const parsed = restockFormSchema.parse(raw);
  return mutations.restock(auth.supabase, parsed, auth.session.user.id);
}

export async function recordAdjustment(raw: unknown): Promise<InventoryTransaction[]> {
  const auth = await requirePermission("inventory.adjustment.record");
  if (auth.error) throw new Error("Forbidden");
  const parsed = adjustmentFormSchema.parse(raw);
  return mutations.recordAdjustment(auth.supabase, parsed, auth.session.user.id);
}

export async function logWastage(raw: unknown): Promise<InventoryTransaction[]> {
  const auth = await requirePermission("inventory.wastage.log");
  if (auth.error) throw new Error("Forbidden");
  const parsed = wastageFormSchema.parse(raw);
  return mutations.logWastage(auth.supabase, parsed, auth.session.user.id);
}

export async function approveWastage(raw: unknown): Promise<InventoryTransaction> {
  const auth = await requirePermission("inventory.wastage.approve");
  if (auth.error) throw new Error("Forbidden");
  const parsed = approveWastageSchema.parse(raw);
  return mutations.approveWastageTransaction(
    auth.supabase,
    parsed.transaction_id,
    parsed.decision,
    parsed.note,
  );
}
