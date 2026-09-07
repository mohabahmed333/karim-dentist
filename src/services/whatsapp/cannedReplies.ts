import type { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type AdminClient = Awaited<ReturnType<typeof createClient>>;
export type WhatsappCannedReply =
  Database["public"]["Tables"]["whatsapp_canned_replies"]["Row"];

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
  input: {
    slash_key: string;
    title: string;
    title_ar?: string | null;
    body: string;
    body_ar?: string | null;
    sort_order?: number;
  },
): Promise<WhatsappCannedReply> {
  const { data, error } = await supabase
    .from("whatsapp_canned_replies")
    .insert({
      slash_key: input.slash_key,
      title: input.title,
      title_ar: input.title_ar?.trim() || null,
      body: input.body,
      body_ar: input.body_ar?.trim() || null,
      sort_order: input.sort_order ?? 100,
      active: true,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCannedReply(
  supabase: AdminClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_canned_replies")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
