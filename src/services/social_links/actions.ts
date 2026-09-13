"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import * as mutations from "./mutations";
import type { SocialLink, SocialLinkInsert, SocialLinkUpdate } from "./mutations";

export async function createSocialLink(
  payload: SocialLinkInsert,
): Promise<SocialLink> {
  const auth = await requirePermission("customize.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createSocialLink(auth.supabase, payload);
}

export async function updateSocialLink(
  id: string,
  payload: SocialLinkUpdate,
): Promise<SocialLink> {
  const auth = await requirePermission("customize.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateSocialLink(auth.supabase, id, payload);
}

export async function softDeleteSocialLink(id: string): Promise<void> {
  const auth = await requirePermission("customize.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteSocialLink(auth.supabase, id);
}
