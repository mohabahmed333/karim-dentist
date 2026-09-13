"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { SiteSettings, SiteSettingsUpdate } from "./types";
import * as mutations from "./mutations";

export async function updateSettings(
  id: string,
  payload: SiteSettingsUpdate,
): Promise<SiteSettings> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateSettings(auth.supabase, id, payload);
}

export async function createSettings(
  payload: SiteSettingsUpdate,
): Promise<SiteSettings> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createSettings(auth.supabase, payload);
}

export async function upsertSettings(
  existing: SiteSettings | null,
  payload: SiteSettingsUpdate,
): Promise<SiteSettings> {
  const auth = await requirePermission("settings.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.upsertSettings(auth.supabase, existing, payload);
}
