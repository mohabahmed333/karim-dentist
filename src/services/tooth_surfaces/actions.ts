"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { PatientToothSurface } from "./types";
import * as mutations from "./mutations";

export async function upsertToothSurfaces(
  patientKey: string,
  input: unknown,
): Promise<PatientToothSurface> {
  const auth = await requirePermission("patients.chart.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.upsertToothSurfaces(auth.supabase, patientKey, input);
}
