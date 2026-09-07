import { createClient } from "@/lib/supabase/client";
import type { ClinicCdtFee, ClinicTreatmentPreset } from "./types";

export async function listClinicCdtFees(): Promise<ClinicCdtFee[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_cdt_fees")
    .select("*")
    .order("code");
  if (error) throw error;
  return data ?? [];
}

export async function listClinicTreatmentPresets(): Promise<
  ClinicTreatmentPreset[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_treatment_presets")
    .select("*")
    .order("slot");
  if (error) throw error;
  return data ?? [];
}
