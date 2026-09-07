import { createClient } from "@/lib/supabase/client";
import type { PatientTreatment } from "./types";

export async function updateTreatmentFee(
  id: string,
  feeAmount: number,
): Promise<PatientTreatment> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatments")
    .update({ fee_amount: feeAmount, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientTreatment;
}
