import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import { patientKeyFromNamePhone } from "@/services/reservations/patientHistory";
import type { PatientProfileUpsertValues } from "./schemas";
import type { PatientProfile } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function resolvePatientId(
  supabase: AnySupabase,
  input: {
    patientId?: string | null;
    displayName: string;
    phone: string;
    email?: string | null;
  },
): Promise<string> {
  if (input.patientId) return input.patientId;

  const patientKey = patientKeyFromNamePhone(input.displayName, input.phone);

  const existing = await supabase
    .from("patients")
    .select("id")
    .eq("patient_key", patientKey)
    .maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.id;

  const inserted = await supabase
    .from("patients")
    .insert({
      patient_key: patientKey,
      display_name: input.displayName,
      phone: input.phone,
      email: input.email ?? null,
    })
    .select("id")
    .single();
  if (!inserted.error) return inserted.data.id;

  // Two staff members submitting for the same brand-new patient at once —
  // the unique patient_key constraint lost the race, so the other insert won.
  if (inserted.error.code === "23505") {
    const retry = await supabase
      .from("patients")
      .select("id")
      .eq("patient_key", patientKey)
      .single();
    if (retry.error) throw retry.error;
    return retry.data.id;
  }
  throw inserted.error;
}

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
