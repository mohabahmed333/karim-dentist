import { createClient } from "@/lib/supabase/client";
import type { PatientTreatment, PatientTreatmentRow } from "./types";

const TREATMENT_SELECT =
  "*, reservation:reservations(*), patient_treatment_attachments(*)";

export async function listPatientTreatments(
  patientKey: string,
): Promise<PatientTreatmentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("patient_treatments")
    .select(TREATMENT_SELECT)
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientTreatmentRow[];
}

export async function listPatientTreatmentsServer(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  patientKey: string,
): Promise<PatientTreatmentRow[]> {
  const { data, error } = await supabase
    .from("patient_treatments")
    .select(TREATMENT_SELECT)
    .eq("patient_key", patientKey)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientTreatmentRow[];
}

export type DoctorProduction = {
  total: number;
  completedCount: number;
};

/**
 * Sums fee_amount for a doctor's completed treatments whose linked
 * reservation falls in [fromIso, toIso]. Treatments with no reservation_id
 * (recorded outside a booked visit) aren't counted — a known MVP gap.
 */
export async function listDoctorProductionThisWeek(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  doctorId: string,
  fromIso: string,
  toIso: string,
): Promise<DoctorProduction> {
  const { data, error } = await supabase
    .from("patient_treatments")
    .select("fee_amount, status, reservation:reservations!inner(doctor_id, starts_at)")
    .eq("reservation.doctor_id", doctorId)
    .gte("reservation.starts_at", fromIso)
    .lte("reservation.starts_at", toIso)
    .eq("status", "done");
  if (error) throw error;
  const rows = data ?? [];
  return {
    total: rows.reduce((sum, row) => sum + (row.fee_amount ?? 0), 0),
    completedCount: rows.length,
  };
}

export type { PatientTreatment };
