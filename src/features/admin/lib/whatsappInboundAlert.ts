export type InboundChimeEvent = "INSERT" | "UPDATE" | "DELETE" | string;

export type InboundChimeInput = {
  eventType: InboundChimeEvent;
  direction: string | null | undefined;
  conversationId: string;
  messageId: string;
  selectedConversationId: string;
  threadVisible: boolean;
};

const seenIds = new Set<string>();
const SEEN_CAP = 400;

export function resetInboundChimeSeen() {
  seenIds.clear();
}

function claimMessage(id: string): boolean {
  if (!id || seenIds.has(id)) return false;
  seenIds.add(id);
  if (seenIds.size > SEEN_CAP) {
    const first = seenIds.values().next().value;
    if (typeof first === "string") seenIds.delete(first);
  }
  return true;
}

/** True when this inbound insert should play a chime (first time only). */
export function takeInboundChime(input: InboundChimeInput): boolean {
  if (input.eventType !== "INSERT") return false;
  if (input.direction !== "inbound") return false;
  if (!claimMessage(input.messageId)) return false;
  if (input.threadVisible && input.conversationId === input.selectedConversationId) {
    return false;
  }
  return true;
}

export function parseUnreadCount(unread?: string): number {
  if (!unread) return 0;
  const n = Number.parseInt(unread, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function unreadTotalFromConversations(
  rows: { unread?: string }[],
): number {
  return rows.reduce((sum, row) => sum + parseUnreadCount(row.unread), 0);
}

export function formatUnreadBadge(count: number): string | null {
  if (count <= 0) return null;
  return count > 99 ? "99+" : String(count);
}
