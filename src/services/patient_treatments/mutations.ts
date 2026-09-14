import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import { createClient } from "@/lib/supabase/client";
import { deductRecipeForCompletion } from "@/services/inventory/mutations";
import type { ConsumableUsage } from "@/services/inventory/types";
import type { TreatmentUpsertValues } from "./schemas";
import type { PatientTreatment } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createPatientTreatment(
  patientKey: string,
  input: TreatmentUpsertValues,
): Promise<PatientTreatment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatments")
    .insert({
      patient_key: patientKey,
      tooth_name: input.tooth_name,
      tooth_fdi: input.tooth_fdi || null,
      severity: input.severity,
      last_treatment: input.last_treatment ?? "",
      cdt_code: input.cdt_code ?? null,
      phase: input.phase ?? "restorative",
      fee_amount: input.fee_amount ?? 0,
      ai_title: input.ai_title || null,
      ai_description: input.ai_description || null,
      ai_confidence: input.ai_confidence ?? null,
      ai_recommendation: input.ai_recommendation || null,
      status: input.status ?? "open",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientTreatment;
}

export async function updatePatientTreatment(
  id: string,
  input: TreatmentUpsertValues,
): Promise<PatientTreatment> {
  const supabase = createClient();

  // Marking a treatment done now has an irreversible side effect (inventory
  // deducts per the service's recipe) and must go through completeTreatment,
  // which checks that recipe before flipping status. Only the transition
  // into 'done' is blocked here — re-saving an already-done treatment's
  // other fields must keep working.
  if (input.status === "done") {
    const { data: current, error: statusError } = await supabase
      .from("patient_treatments")
      .select("status")
      .eq("id", id)
      .single();
    if (statusError) throw statusError;
    if (current.status !== "done") {
      throw new Error("Use completeTreatment to mark a treatment done");
    }
  }

  const { data, error } = await supabase
    .from("patient_treatments")
    .update({
      tooth_name: input.tooth_name,
      tooth_fdi: input.tooth_fdi || null,
      severity: input.severity,
      last_treatment: input.last_treatment ?? "",
      ai_title: input.ai_title || null,
      ai_description: input.ai_description || null,
      ai_confidence: input.ai_confidence ?? null,
      ai_recommendation: input.ai_recommendation || null,
      status: input.status ?? "open",
      updated_at: new Date().toISOString(),
      ...(input.cdt_code !== undefined ? { cdt_code: input.cdt_code } : {}),
      ...(input.phase !== undefined ? { phase: input.phase } : {}),
      ...(input.fee_amount !== undefined ? { fee_amount: input.fee_amount } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientTreatment;
}

/**
 * The only path to status = 'done'. Runs with a server client (unlike the
 * rest of this file, which is browser-client-only) because it's reached
 * through the "use server" action in patient_treatments/actions.ts, which
 * carries requirePermission's auth.supabase.
 *
 * Fixed-kit recipe rows deduct silently; variable rows must already carry a
 * qty_used > 0 in `usages` or deductRecipeForCompletion throws before
 * status ever changes.
 */
export async function completeTreatment(
  supabase: AnySupabase,
  id: string,
  usages: ConsumableUsage[],
  createdBy: string,
): Promise<PatientTreatment> {
  const { data: existing, error: fetchError } = await supabase
    .from("patient_treatments")
    .select("id, status, service_id")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;
  if (existing.status === "done") {
    throw new Error("Treatment is already marked done");
  }

  if (existing.service_id) {
    await deductRecipeForCompletion(supabase, {
      serviceId: existing.service_id,
      reservationId: null,
      patientTreatmentId: id,
      usages,
      createdBy,
    });
  }

  const { data, error } = await supabase
    .from("patient_treatments")
    .update({ status: "done", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientTreatment;
}

export async function deletePatientTreatment(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("patient_treatments").delete().eq("id", id);
  if (error) throw error;
}

export async function markTreatmentScheduled(
  id: string,
  reservationId: string,
): Promise<PatientTreatment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatments")
    .update({
      status: "scheduled",
      reservation_id: reservationId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientTreatment;
}
