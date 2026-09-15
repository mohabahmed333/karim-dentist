"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { adminNoteContentSchema } from "./schemas";
import type { AdminNote } from "./types";
import * as mutations from "./mutations";

export async function createAdminNote(content: string): Promise<AdminNote> {
  const auth = await requirePermission("notes.manage");
  if (auth.error) throw new Error("Forbidden");
  const parsed = adminNoteContentSchema.parse({ content });
  return mutations.createAdminNote(auth.supabase, {
    content: parsed.content,
    createdBy: auth.session?.user.id ?? null,
  });
}

export async function updateAdminNoteContent(
  id: string,
  content: string,
): Promise<AdminNote> {
  const auth = await requirePermission("notes.manage");
  if (auth.error) throw new Error("Forbidden");
  const parsed = adminNoteContentSchema.parse({ content });
  return mutations.updateAdminNoteContent(auth.supabase, id, parsed.content);
}

export async function dismissAdminNote(id: string): Promise<void> {
  const auth = await requirePermission("notes.manage");
  if (auth.error) throw new Error("Forbidden");
  return mutations.dismissAdminNote(auth.supabase, id);
}
