"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { Service, ServiceInsert, ServiceUpdate } from "./types";
import * as mutations from "./mutations";

export async function createService(payload: ServiceInsert): Promise<Service> {
  const auth = await requirePermission("services.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createService(auth.supabase, payload);
}

export async function updateService(
  id: string,
  payload: ServiceUpdate,
): Promise<Service> {
  const auth = await requirePermission("services.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateService(auth.supabase, id, payload);
}

export async function softDeleteService(id: string): Promise<void> {
  const auth = await requirePermission("services.delete");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteService(auth.supabase, id);
}
