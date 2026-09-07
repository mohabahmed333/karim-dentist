import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

export type PatientImaging = Tables<"patient_imaging">;
export type PatientImagingInsert = TablesInsert<"patient_imaging">;
export type ImagingKind = PatientImaging["kind"];
