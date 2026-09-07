import { createClient } from "@/lib/supabase/client";
import type { ImagingCreateValues } from "./schemas";
import type { PatientImaging } from "./types";

export async function createPatientImaging(
  patientKey: string,
  input: ImagingCreateValues,
): Promise<PatientImaging> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_imaging")
    .insert({
      patient_key: patientKey,
      title: input.title,
      kind: input.kind,
      tooth_number: input.tooth_number ?? null,
      tooth_fdi: input.tooth_fdi ?? null,
      file_url: input.file_url,
      file_name: input.file_name,
      mime_type: input.mime_type,
      taken_at: input.taken_at ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientImaging;
}

export async function deletePatientImaging(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("patient_imaging").delete().eq("id", id);
  if (error) throw error;
}
