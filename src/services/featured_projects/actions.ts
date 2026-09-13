"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { FeaturedInsert, FeaturedProject, FeaturedUpdate } from "./types";
import * as mutations from "./mutations";

export async function createFeatured(
  payload: FeaturedInsert,
): Promise<FeaturedProject> {
  const auth = await requirePermission("featured.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createFeatured(auth.supabase, payload);
}

export async function updateFeatured(
  id: string,
  payload: FeaturedUpdate,
): Promise<FeaturedProject> {
  const auth = await requirePermission("featured.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateFeatured(auth.supabase, id, payload);
}

export async function softDeleteFeatured(id: string): Promise<void> {
  const auth = await requirePermission("featured.delete");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteFeatured(auth.supabase, id);
}
