"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { PatientProfileUpsertValues } from "./schemas";
import type { PatientProfile } from "./types";
import * as mutations from "./mutations";

export async function upsertPatientProfile(
  patientKey: string,
  input: PatientProfileUpsertValues,
): Promise<PatientProfile> {
  const auth = await requirePermission("patients.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.upsertPatientProfile(auth.supabase, patientKey, input);
}
