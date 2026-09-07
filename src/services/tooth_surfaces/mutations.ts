import { createClient } from "@/lib/supabase/client";
import { toothSurfaceUpsertSchema } from "./schemas";
import type { PatientToothSurface } from "./types";

export async function upsertToothSurfaces(
  patientKey: string,
  input: unknown,
): Promise<PatientToothSurface> {
  const parsed = toothSurfaceUpsertSchema.parse(input);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_tooth_surfaces")
    .upsert(
      {
        patient_key: patientKey,
        ...parsed,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "patient_key,fdi_number" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientToothSurface;
}
