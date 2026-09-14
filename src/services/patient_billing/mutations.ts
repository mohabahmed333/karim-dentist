import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { BillingEntryUpsertValues } from "./schemas";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export async function addBillingEntry(
  supabase: ServerSupabase,
  patientKey: string,
  createdBy: string,
  input: BillingEntryUpsertValues,
): Promise<void> {
  const { error } = await supabase.from("patient_billing_entries").insert({
    patient_key: patientKey,
    kind: input.kind,
    amount_egp: input.amount_egp,
    description: input.description,
    method: input.method,
    created_by: createdBy,
    reservation_id: input.reservation_id ?? null,
  });
  if (error) throw error;
}
