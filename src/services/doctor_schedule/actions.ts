"use server";

import { requirePermission, requirePermissionOrSelf } from "@/lib/api/requirePermission";
import type { DoctorHoursUpsertValues } from "./schemas";
import * as mutations from "./mutations";

export async function saveDoctorHours(
  doctorId: string,
  input: DoctorHoursUpsertValues,
) {
  const auth = await requirePermissionOrSelf("settings.edit", doctorId);
  if (auth.error) throw new Error("Forbidden");
  return mutations.saveDoctorHours(auth.supabase, doctorId, input);
}

export async function regenerateOneDoctorSlots(doctorId: string) {
  const auth = await requirePermissionOrSelf("settings.edit", doctorId);
  if (auth.error) throw new Error("Forbidden");
  return mutations.regenerateOneDoctorSlots(auth.supabase, doctorId);
}

export async function regenerateAllDoctorSlots() {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.regenerateAllDoctorSlots(auth.supabase);
}
