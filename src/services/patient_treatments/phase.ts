import { createClient } from "@/lib/supabase/client";
import type { PatientTreatment } from "./types";

export async function updateTreatmentPhase(
  id: string,
  phase: PatientTreatment["phase"],
): Promise<PatientTreatment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatments")
    .update({ phase, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientTreatment;
}
