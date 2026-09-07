import type { SupportMessage } from "../supportDummyData";

export type MessageSearchHit = {
  id: string;
  snippet: string;
  authorName: string;
  time: string;
};

/** Lowercased searchable text for a message. */
export function messageSearchHaystack(message: SupportMessage): string {
  const parts: string[] = [message.body ?? ""];
  for (const m of message.media ?? []) {
    if (m.name) parts.push(m.name);
  }
  const flow = message.flow;
  if (flow?.address) parts.push(flow.address);
  if (flow?.title) parts.push(flow.title);
  if (flow?.subtitle) parts.push(flow.subtitle);
  return parts.join(" ").toLowerCase();
}

function snippetFor(message: SupportMessage, query: string): string {
  const q = query.trim().toLowerCase();
  const body = (message.body ?? "").trim();
  if (body) {
    const lower = body.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx >= 0) {
      const start = Math.max(0, idx - 24);
      const end = Math.min(body.length, idx + q.length + 36);
      const prefix = start > 0 ? "…" : "";
      const suffix = end < body.length ? "…" : "";
      return `${prefix}${body.slice(start, end)}${suffix}`;
    }
    return body.length > 72 ? `${body.slice(0, 72)}…` : body;
  }
  const mediaName = message.media?.find((m) => m.name)?.name;
  if (mediaName) return mediaName;
  if (message.flow?.address) return message.flow.address;
  return message.flow?.title ?? "";
}

/** Chronological matches (same order as `messages`). */
export function findMessageMatches(
  messages: SupportMessage[],
  query: string,
): MessageSearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return messages
    .filter((m) => messageSearchHaystack(m).includes(q))
    .map((m) => ({
      id: m.id,
      snippet: snippetFor(m, query),
      authorName: m.authorName,
      time: m.time,
    }));
}
