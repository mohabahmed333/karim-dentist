import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";

/** A quick reply row as the composer's / menu receives it from the API. */
export type QuickReplyMenuItem = {
  id: string;
  slash_key: string;
  title: string;
  title_ar?: string | null;
  body: string;
  body_ar?: string | null;
  category?: string | null;
  use_count?: number;
  sort_order?: number;
  attachment?: CannedReplyAttachment | null;
};

/** Most used first; ties keep the order staff set on the management page. */
export function sortQuickReplies<T extends QuickReplyMenuItem>(replies: T[]): T[] {
  return [...replies].sort(
    (a, b) =>
      (b.use_count ?? 0) - (a.use_count ?? 0) || (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
}

export function matchesQuickReply(reply: QuickReplyMenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [reply.slash_key, reply.title, reply.title_ar, reply.body, reply.body_ar, reply.category].some(
    (value) => (value ?? "").toLowerCase().includes(q),
  );
}
