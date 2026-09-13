"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import type { Faq, FaqInsert, FaqUpdate } from "./types";
import * as mutations from "./mutations";

export async function createFaq(payload: FaqInsert): Promise<Faq> {
  const auth = await requirePermission("faq.create");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createFaq(auth.supabase, payload);
}

export async function updateFaq(id: string, payload: FaqUpdate): Promise<Faq> {
  const auth = await requirePermission("faq.edit");
  if (auth.error) throw new Error("Forbidden");
  return mutations.updateFaq(auth.supabase, id, payload);
}

export async function softDeleteFaq(id: string): Promise<void> {
  const auth = await requirePermission("faq.delete");
  if (auth.error) throw new Error("Forbidden");
  return mutations.softDeleteFaq(auth.supabase, id);
}
