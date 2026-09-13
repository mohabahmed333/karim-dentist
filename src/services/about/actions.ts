"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { About, AboutUpdate } from "./types";
import * as mutations from "./mutations";

export async function updateAbout(id: string, payload: AboutUpdate): Promise<About> {
  const auth = await requirePermission("about.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateAbout(auth.supabase, id, payload);
}

export async function createAbout(payload: AboutUpdate): Promise<About> {
  const auth = await requirePermission("about.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createAbout(auth.supabase, payload);
}

export async function upsertAbout(
  existing: About | null,
  payload: AboutUpdate,
): Promise<About> {
  const auth = await requirePermission("about.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.upsertAbout(auth.supabase, existing, payload);
}
