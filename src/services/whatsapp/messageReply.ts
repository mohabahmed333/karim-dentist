import type { Json } from "@/lib/supabase/database.types";
import type { KapsoMessagePayload } from "./types";

export type MessageReplyTo = {
  wamid: string;
  authorName: string;
  body: string;
  messageType?: string;
};

export function replyToJson(reply: MessageReplyTo | null): Json | null {
  return reply as unknown as Json | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/** Resolve WhatsApp reply context id from Kapso / Meta payload shapes. */
export function extractReplyContext(
  message: KapsoMessagePayload,
): { wamid: string } | null {
  const raw = message as KapsoMessagePayload & Record<string, unknown>;
  const candidates = [
    asRecord(raw.context),
    asRecord(asRecord(raw.kapso)?.context),
    asRecord(asRecord(raw.message)?.context),
  ];
  for (const context of candidates) {
    const id =
      (typeof context?.id === "string" && context.id) ||
      (typeof context?.message_id === "string" && context.message_id) ||
      null;
    if (id) return { wamid: id };
  }
  return null;
}

export function previewForReplyBody(
  body: string | null | undefined,
  messageType?: string | null,
): string {
  const trimmed = (body ?? "").trim();
  if (trimmed) return trimmed.slice(0, 160);
  const type = (messageType ?? "").toLowerCase();
  if (type === "image" || type === "sticker") return "Photo";
  if (type === "audio" || type === "voice") return "Voice message";
  if (type === "video") return "Video";
  if (type === "document") return "Document";
  if (type === "location") return "Location";
  if (type === "contacts") return "Contact";
  if (type === "interactive") return "Interactive message";
  return "Original message";
}
