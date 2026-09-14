"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { consumablesCheckoutSchema } from "@/services/inventory/schemas";
import type { PatientTreatment } from "./types";
import * as mutations from "./mutations";

/**
 * The only way to mark a treatment done. `consumables` must include a
 * qty_used for every `kind: 'variable'` recipe row on the treatment's
 * service — enforced here via zod and again inside
 * deductRecipeForCompletion, so a direct call bypassing the checkout dialog
 * hits the same validation.
 */
export async function completeTreatment(
  id: string,
  consumables: unknown,
): Promise<PatientTreatment> {
  const auth = await requirePermission("patient_treatments.complete");
  if (auth.error) throw new Error("Forbidden");
  const usages = consumablesCheckoutSchema.parse(consumables ?? []);
  return mutations.completeTreatment(auth.supabase, id, usages, auth.session.user.id);
}
