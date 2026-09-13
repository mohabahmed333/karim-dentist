"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { ClinicalNoteInsert } from "@/services/admin_ai/clinicalPayloads";
import * as mutations from "./mutations";
import type { PatientClinicalNoteRow } from "./mutations";

export async function createPatientClinicalNote(
  input: ClinicalNoteInsert,
): Promise<PatientClinicalNoteRow> {
  const auth = await requirePermission("patients.notes.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createPatientClinicalNote(auth.supabase, input);
}
