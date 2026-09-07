import { createClient } from "@/lib/supabase/client";
import type { PatientProfileUpsertValues } from "./schemas";
import type { PatientProfile } from "./types";

export async function upsertPatientProfile(
  patientKey: string,
  input: PatientProfileUpsertValues,
): Promise<PatientProfile> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_profiles")
    .upsert(
      {
        patient_key: patientKey,
        display_name: input.display_name,
        phone: input.phone,
        email: input.email ?? null,
        date_of_birth: input.date_of_birth ?? null,
        age_years: input.age_years ?? null,
        gender: input.gender,
        medical_history: input.medical_history,
        allergies: input.allergies,
        medications: input.medications,
        notes: input.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "patient_key" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientProfile;
}
