import type {
  WhatsappConversation,
  WhatsappMessage,
} from "@/services/whatsapp/types";
import type { SupportMessage } from "@/features/admin/components/support/supportDummyData";

export function upsertConversationRow(
  rows: WhatsappConversation[],
  next: WhatsappConversation,
): WhatsappConversation[] {
  const rest = rows.filter((row) => row.id !== next.id);
  return [next, ...rest];
}

export function patchConversationsFromMessage(
  rows: WhatsappConversation[],
  message: WhatsappMessage,
): WhatsappConversation[] {
  const current = rows.find((row) => row.id === message.conversation_id);
  if (!current) return rows;
  const inbound = message.direction === "inbound";
  return upsertConversationRow(rows, {
    ...current,
    last_message_at: message.wa_timestamp ?? current.last_message_at,
    last_message_preview: message.body || current.last_message_preview,
    last_message_type: message.message_type || current.last_message_type,
    last_message_status: message.status || current.last_message_status,
    last_inbound_at: inbound
      ? message.wa_timestamp
      : current.last_inbound_at,
    updated_at: message.updated_at ?? current.updated_at,
  });
}

function newestStamp(rows: WhatsappConversation[]): string {
  let max = "";
  for (const row of rows) {
    const stamp = row.updated_at || row.last_message_at || "";
    if (stamp > max) max = stamp;
  }
  return max;
}

/** Keep in-memory rows when a parent re-render passes an older server seed. */
export function preferLiveConversations(
  seed: WhatsappConversation[],
  live: WhatsappConversation[],
): WhatsappConversation[] {
  if (live.length === 0) return seed;
  if (newestStamp(live) >= newestStamp(seed)) return live;
  return seed;
}

export function mergeSupportMessages(
  fetched: SupportMessage[],
  live: SupportMessage[],
): SupportMessage[] {
  const byId = new Map<string, SupportMessage>();
  for (const row of fetched) byId.set(row.id, row);
  for (const row of live) {
    if (!byId.has(row.id)) byId.set(row.id, row);
  }
  return [...byId.values()].sort((a, b) =>
    (a.waTimestamp ?? "").localeCompare(b.waTimestamp ?? ""),
  );
}
