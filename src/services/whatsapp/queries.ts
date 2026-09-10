import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { createServiceClient } from "@/lib/supabase/service";
import { sanitizeIlike } from "@/services/reservations/listFilters";
import type { WhatsappConversation, WhatsappMessage } from "./types";
import { buildMessageCursorFilter } from "./messageCursor";

type AnySupabase =
  | ReturnType<typeof createServiceClient>
  | Awaited<ReturnType<typeof createBrowserClient>>
  | Awaited<
      ReturnType<typeof import("@/lib/supabase/server").createClient>
    >;

export type MessageCursor = {
  waTimestamp: string;
  id: string;
};

export type ConversationListFilters = {
  q?: string;
  /** open = active/ended/null; archived; all */
  status?: "open" | "archived" | "all";
  sort?: "newest" | "name" | "unread";
  limit?: number;
};

export async function listConversations(
  supabase: AnySupabase,
  filters?: ConversationListFilters | null,
): Promise<WhatsappConversation[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase.from("whatsapp_conversations").select("*");

  const status = filters?.status ?? "all";
  if (status === "archived") {
    query = query.eq("status", "archived");
  } else if (status === "open") {
    query = query.or("status.eq.active,status.eq.ended");
  }

  const q = sanitizeIlike(filters?.q ?? "");
  if (q) {
    query = query.or(
      `contact_name.ilike.%${q}%,phone_number.ilike.%${q}%,last_message_preview.ilike.%${q}%`,
    );
  }

  const sort = filters?.sort ?? "newest";
  if (sort === "name") {
    query = query.order("contact_name", { ascending: true, nullsFirst: false });
  } else if (sort === "unread") {
    query = query
      .order("unread_count", { ascending: false, nullsFirst: false })
      .order("last_message_at", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("last_message_at", {
      ascending: false,
      nullsFirst: false,
    });
  }

  if (filters?.limit && filters.limit > 0) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function listMessages(
  supabase: AnySupabase,
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
  supabase: AnySupabase,
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

  const cursorFilter = buildMessageCursorFilter(opts?.before);
  if (cursorFilter) {
    // Composite keyset: strictly older, or same instant with a smaller id.
    // A timestamp-only bound skips messages sharing the boundary instant.
    query = query.or(cursorFilter);
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
  supabase: AnySupabase,
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
  supabase: AnySupabase,
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
