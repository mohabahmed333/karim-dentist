import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import {
  QUICK_REPLY_BUCKET,
  type CreateCannedReplyInput,
  type UpdateCannedReplyInput,
} from "./cannedReplyInput";

type AdminClient = Awaited<ReturnType<typeof createClient>>;
type CannedReplyUpdate = Database["public"]["Tables"]["whatsapp_canned_replies"]["Update"];
export type WhatsappCannedReply =
  Database["public"]["Tables"]["whatsapp_canned_replies"]["Row"];

const blankToNull = (value: string | null | undefined) => value?.trim() || null;

export async function listCannedReplies(
  supabase: AdminClient,
  opts?: { activeOnly?: boolean },
): Promise<WhatsappCannedReply[]> {
  let q = supabase
    .from("whatsapp_canned_replies")
    .select("*")
    .order("sort_order", { ascending: true });
  if (opts?.activeOnly !== false) {
    q = q.eq("active", true);
  }
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function createCannedReply(
  supabase: AdminClient,
  input: CreateCannedReplyInput,
): Promise<WhatsappCannedReply> {
  const { data, error } = await supabase
    .from("whatsapp_canned_replies")
    .insert({
      slash_key: input.slash_key,
      title: input.title,
      title_ar: blankToNull(input.title_ar),
      body: input.body,
      body_ar: blankToNull(input.body_ar),
      category: blankToNull(input.category),
      sort_order: input.sort_order ?? 100,
      active: input.active ?? true,
      attachment: input.attachment ?? null,
      buttons: input.buttons ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** The row patch for an update: only keys the caller sent, blanks stored as null. */
export function toCannedReplyPatch(
  input: UpdateCannedReplyInput,
  now: Date = new Date(),
): CannedReplyUpdate {
  const patch: CannedReplyUpdate = { updated_at: now.toISOString() };
  if (input.slash_key !== undefined) patch.slash_key = input.slash_key;
  if (input.title !== undefined) patch.title = input.title;
  if (input.title_ar !== undefined) patch.title_ar = blankToNull(input.title_ar);
  if (input.body !== undefined) patch.body = input.body;
  if (input.body_ar !== undefined) patch.body_ar = blankToNull(input.body_ar);
  if (input.category !== undefined) patch.category = blankToNull(input.category);
  if (input.sort_order !== undefined) patch.sort_order = input.sort_order;
  if (input.active !== undefined) patch.active = input.active;
  if (input.attachment !== undefined) patch.attachment = input.attachment;
  if (input.buttons !== undefined) patch.buttons = input.buttons;
  return patch;
}

export async function updateCannedReply(
  supabase: AdminClient,
  id: string,
  input: UpdateCannedReplyInput,
): Promise<WhatsappCannedReply> {
  let previousPath: string | null = null;
  if (input.attachment !== undefined) {
    const { data } = await supabase
      .from("whatsapp_canned_replies")
      .select("attachment")
      .eq("id", id)
      .maybeSingle();
    previousPath = attachmentPath(data?.attachment);
  }
  const { data, error } = await supabase
    .from("whatsapp_canned_replies")
    .update(toCannedReplyPatch(input))
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  if (previousPath && previousPath !== attachmentPath(data.attachment)) {
    await removeAttachmentFile(supabase, previousPath);
  }
  return data;
}

export async function recordCannedReplyUse(
  supabase: AdminClient,
  id: string,
): Promise<void> {
  const { error } = await supabase.rpc("record_canned_reply_use", { p_id: id });
  if (error) throw error;
}

export async function deleteCannedReply(
  supabase: AdminClient,
  id: string,
): Promise<void> {
  const { data, error } = await supabase
    .from("whatsapp_canned_replies")
    .delete()
    .eq("id", id)
    .select("attachment")
    .maybeSingle();
  if (error) throw error;
  const path = attachmentPath(data?.attachment);
  if (path) await removeAttachmentFile(supabase, path);
}

export function attachmentPath(attachment: unknown): string | null {
  if (
    attachment &&
    typeof attachment === "object" &&
    "path" in attachment &&
    typeof attachment.path === "string"
  ) {
    return attachment.path;
  }
  return null;
}

export function isDuplicateSlashKey(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

/** Best effort: a leftover file only costs storage; the edit itself already succeeded. */
async function removeAttachmentFile(supabase: AdminClient, path: string) {
  const { error } = await supabase.storage.from(QUICK_REPLY_BUCKET).remove([path]);
  if (error) console.error("[canned-replies] could not remove attachment", path, error);
}
