"use server";

import { requirePermission } from "@/lib/api/requirePermission";
import { adminNoteContentSchema } from "./schemas";
import type { AdminNote } from "./types";
import * as mutations from "./mutations";

/** Unlike updateAdminNoteContent, empty is allowed here — a freshly created
 * note starts blank and is filled in afterward, unlike an edit to one that
 * already has content. */
export async function createAdminNote(content: string): Promise<AdminNote> {
  const auth = await requirePermission("notes.manage");
  if (auth.error) throw new Error("Forbidden");
  return mutations.createAdminNote(auth.supabase, {
    content: content.trim().slice(0, 2000),
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
