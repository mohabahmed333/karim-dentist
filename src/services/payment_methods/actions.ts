"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { paymentMethodSchema } from "./schemas";
import type { PaymentMethod } from "./types";

/**
 * Making a method primary is two writes, not one: the unique index allows a
 * single primary per kind, so the old one has to stand down first. Done here
 * rather than in a trigger so the order is visible where it is reasoned about.
 */
async function clearPrimary(
  supabase: Awaited<ReturnType<typeof requirePermission>>["supabase"],
  kind: string,
  exceptId?: string,
) {
  let query = supabase
    .from("payment_methods")
    .update({ is_primary: false, updated_at: new Date().toISOString() })
    .eq("kind", kind)
    .eq("is_primary", true)
    .is("deleted_at", null);
  if (exceptId) query = query.neq("id", exceptId);
  await query;
}

export async function savePaymentMethod(
  id: string | null,
  input: unknown,
): Promise<PaymentMethod> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");

  const parsed = paymentMethodSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid payment method");
  }
  const values = parsed.data;

  if (values.is_primary) await clearPrimary(auth.supabase, values.kind, id ?? undefined);

  if (id) {
    const { data, error } = await auth.supabase
      .from("payment_methods")
      .update({ ...values, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await auth.supabase
    .from("payment_methods")
    .insert(values)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setPrimaryPaymentMethod(id: string): Promise<void> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");

  const { data: method } = await auth.supabase
    .from("payment_methods")
    .select("id, kind")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!method) throw new Error("Payment method not found");

  await clearPrimary(auth.supabase, method.kind, id);
  const { error } = await auth.supabase
    .from("payment_methods")
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Soft delete. A receipt sent to a retired number still has to verify against
 * it later, so the row is kept — but `listPaymentMethods` stops returning it,
 * which is what takes it out of both the message and the checks.
 */
export async function deletePaymentMethod(id: string): Promise<void> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");

  const { error } = await auth.supabase
    .from("payment_methods")
    .update({
      deleted_at: new Date().toISOString(),
      is_primary: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
