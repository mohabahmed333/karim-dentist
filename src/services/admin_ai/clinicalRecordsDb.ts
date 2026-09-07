import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/database.types";
import {
  chartFindingInsertSchema,
  labOrderInsertSchema,
  prescriptionInsertSchema,
  type ChartFindingInsert,
  type LabOrderInsert,
  type PrescriptionInsert,
} from "./clinicalPayloads";

type Db = SupabaseClient<Database>;
export type ChartFinding = Tables<"patient_chart_findings">;
export type Prescription = Tables<"patient_prescriptions">;
export type LabOrder = Tables<"patient_lab_orders">;

export async function upsertChartFinding(
  db: Db,
  input: ChartFindingInsert,
): Promise<ChartFinding> {
  const parsed = chartFindingInsertSchema.parse(input);
  const { data, error } = await db
    .from("patient_chart_findings")
    .insert(parsed)
    .select("*")
    .single();
  if (error) throw error;
  return data as ChartFinding;
}

export async function createPrescription(
  db: Db,
  input: PrescriptionInsert,
  createdBy?: string | null,
): Promise<Prescription> {
  const parsed = prescriptionInsertSchema.parse(input);
  if (!parsed.medication || !parsed.dose) {
    throw new Error("Prescription requires medication and dose");
  }
  const { data, error } = await db
    .from("patient_prescriptions")
    .insert({ ...parsed, created_by: createdBy ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as Prescription;
}

export async function createLabOrder(
  db: Db,
  input: LabOrderInsert,
  createdBy?: string | null,
): Promise<LabOrder> {
  const parsed = labOrderInsertSchema.parse(input);
  const { data, error } = await db
    .from("patient_lab_orders")
    .insert({ ...parsed, created_by: createdBy ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as LabOrder;
}

export async function updateLabStatus(
  db: Db,
  id: string,
  status: LabOrder["status"],
): Promise<LabOrder> {
  const { data, error } = await db
    .from("patient_lab_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as LabOrder;
}
