"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { billingEntryUpsertSchema } from "./schemas";
import { addBillingEntry } from "./mutations";

export async function saveBillingEntry(
  patientKey: string,
  input: unknown,
): Promise<void> {
  const auth = await requirePermission("patients.billing.edit");
  if (auth.error) throw new Error("Forbidden");

  const parsed = billingEntryUpsertSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  await addBillingEntry(auth.supabase, patientKey, auth.session.user.id, parsed.data);
}
