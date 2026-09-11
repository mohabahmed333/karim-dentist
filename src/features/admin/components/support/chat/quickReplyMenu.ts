import type { CannedReplyAttachment } from "@/services/whatsapp/cannedReplyInput";
import { lastStrongLocale } from "./textDirection";

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

export type LocalizedQuickReply = { title: string; body: string; locale: "ar" | "en" };

/**
 * The title and body a chat in `locale` inserts. Arabic only when the Arabic
 * column has text; otherwise English. `locale` is the language the chosen body
 * is written in, so its {{fields}} are filled in that language — a reply saved
 * from an Arabic chat can hold Arabic text in `body`.
 */
export function localizeQuickReply(reply: QuickReplyMenuItem, locale: "ar" | "en"): LocalizedQuickReply {
  const pick = (en: string | null | undefined, ar: string | null | undefined) => {
    const arabic = (ar ?? "").trim();
    return locale === "ar" && arabic ? arabic : (en ?? "").trim();
  };
  const title = pick(reply.title, reply.title_ar);
  const arabicBody = locale === "ar" ? (reply.body_ar ?? "").trim() : "";
  if (arabicBody) return { title, body: arabicBody, locale: "ar" };
  const body = (reply.body ?? "").trim();
  return { title, body, locale: lastStrongLocale(body) ?? "en" };
}

export function matchesQuickReply(reply: QuickReplyMenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [reply.slash_key, reply.title, reply.title_ar, reply.body, reply.body_ar, reply.category].some(
    (value) => (value ?? "").toLowerCase().includes(q),
  );
}
