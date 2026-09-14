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

/**
 * Price-only update, for the Clinic Prices admin page — gated by
 * settings.edit like everything else on that page (the CDT fee list next
 * to it), not services.edit, so the same staff role that can price a CDT
 * procedure can price a service too, without touching its title, images,
 * or anything else the full Services editor owns.
 */
export async function updateServicePriceRange(
  serviceId: string,
  priceMinEgp: number | null,
  priceMaxEgp: number | null,
): Promise<void> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  await mutations.updateService(auth.supabase, serviceId, {
    price_min_egp: priceMinEgp,
    price_max_egp: priceMaxEgp,
  });
}
