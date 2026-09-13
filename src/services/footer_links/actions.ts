"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { FooterLink, FooterLinkInsert, FooterLinkUpdate } from "./types";
import * as mutations from "./mutations";

export async function createFooterLink(
  payload: FooterLinkInsert,
): Promise<FooterLink> {
  const auth = await requirePermission("footer-links.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createFooterLink(auth.supabase, payload);
}

export async function updateFooterLink(
  id: string,
  payload: FooterLinkUpdate,
): Promise<FooterLink> {
  const auth = await requirePermission("footer-links.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateFooterLink(auth.supabase, id, payload);
}

export async function softDeleteFooterLink(id: string): Promise<void> {
  const auth = await requirePermission("footer-links.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteFooterLink(auth.supabase, id);
}
