"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { setDoctorServiceIds, type DoctorServiceEntry } from "./mutations";

export async function saveDoctorServices(doctorId: string, entries: DoctorServiceEntry[]) {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return setDoctorServiceIds(auth.supabase, doctorId, entries);
}
