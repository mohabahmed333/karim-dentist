import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { PatientProfileUpsertValues } from "./schemas";
import type { PatientProfile } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function upsertPatientProfile(
  supabase: AnySupabase,
  patientKey: string,
  input: PatientProfileUpsertValues,
): Promise<PatientProfile> {
  const { data, error } = await supabase
    .from("patients")
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
