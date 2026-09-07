import { createClient } from "@/lib/supabase/client";
import type { TreatmentUpsertValues } from "./schemas";
import type { PatientTreatment } from "./types";

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
