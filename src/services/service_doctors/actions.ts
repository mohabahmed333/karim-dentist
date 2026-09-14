"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { setDoctorServiceIds } from "./mutations";

export async function saveDoctorServices(doctorId: string, serviceIds: string[]) {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return setDoctorServiceIds(auth.supabase, doctorId, serviceIds);
}
