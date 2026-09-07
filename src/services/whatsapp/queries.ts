import type { createServiceClient } from "@/lib/supabase/service";
import type { WhatsappConversation, WhatsappMessage } from "./types";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type MessageCursor = {
  waTimestamp: string;
  id: string;
};

export async function listConversations(
  supabase: ServiceClient,
): Promise<WhatsappConversation[]> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function listMessages(
  supabase: ServiceClient,
  conversationId: string,
): Promise<WhatsappMessage[]> {
  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("wa_timestamp", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Latest page first (desc), then reverse to chronological for UI. */
export async function listMessagesPage(
  supabase: ServiceClient,
  conversationId: string,
  opts?: { before?: MessageCursor | null; limit?: number },
): Promise<{ messages: WhatsappMessage[]; nextCursor: MessageCursor | null }> {
  const limit = opts?.limit ?? 30;
  let query = supabase
    .from("whatsapp_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("wa_timestamp", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + 1);

  if (opts?.before) {
    // Strictly older than cursor (timestamp, then id)
    query = query.lt("wa_timestamp", opts.before.waTimestamp);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const oldest = page[page.length - 1];
  const nextCursor =
    hasMore && oldest
      ? { waTimestamp: oldest.wa_timestamp, id: oldest.id }
      : null;

  return {
    messages: [...page].reverse(),
    nextCursor,
  };
}

export async function getConversation(
  supabase: ServiceClient,
  id: string,
): Promise<WhatsappConversation | null> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listNotes(
  supabase: ServiceClient,
  conversationId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_notes")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
