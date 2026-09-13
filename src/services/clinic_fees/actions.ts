"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { ClinicCdtFee } from "./types";
import * as mutations from "./mutations";

export async function upsertClinicCdtFee(
  code: string,
  feeEgp: number,
): Promise<ClinicCdtFee> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.upsertClinicCdtFee(auth.supabase, code, feeEgp);
}

export async function deleteClinicCdtFee(code: string): Promise<void> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.deleteClinicCdtFee(auth.supabase, code);
}

export async function saveClinicFeeSchedule(
  fees: ReadonlyArray<{ code: string; fee_egp: number }>,
): Promise<void> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.saveClinicFeeSchedule(auth.supabase, fees);
}

export async function saveClinicTreatmentPresets(
  presets: ReadonlyArray<{ slot: number; code: string; label: string }>,
): Promise<void> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.saveClinicTreatmentPresets(auth.supabase, presets);
}
