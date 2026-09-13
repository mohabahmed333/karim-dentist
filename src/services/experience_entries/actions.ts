"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type {
  ExperienceEntry,
  ExperienceInsert,
  ExperienceUpdate,
} from "./types";
import * as mutations from "./mutations";

export async function createExperience(
  payload: ExperienceInsert,
): Promise<ExperienceEntry> {
  const auth = await requirePermission("experience.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createExperience(auth.supabase, payload);
}

export async function updateExperience(
  id: string,
  payload: ExperienceUpdate,
): Promise<ExperienceEntry> {
  const auth = await requirePermission("experience.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateExperience(auth.supabase, id, payload);
}

export async function softDeleteExperience(id: string): Promise<void> {
  const auth = await requirePermission("experience.delete");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteExperience(auth.supabase, id);
}
