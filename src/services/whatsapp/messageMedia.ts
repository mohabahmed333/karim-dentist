import { extractKapsoTranscript } from "./transcript";
import type { Json } from "@/lib/supabase/database.types";
import type { KapsoMessagePayload } from "./types";

export type MessageMediaItem = {
  url: string;
  mime?: string;
  name?: string;
  size?: number;
  peaks?: number[];
};

export type MessageFlowPayload = {
  kind?: "flow" | "buttons" | "cta" | "location" | "contacts" | "template" | "button_reply";
  title?: string;
  subtitle?: string;
  cta?: string;
  fields?: string[];
  buttons?: { id: string; title: string }[];
  ctaUrl?: string;
  ctaLabel?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  phone?: string;
  /** The tapped button or list item's id, for a `kind: "button_reply"` row. */
  buttonId?: string;
  /** Whether the tap was a reply button or a list item, for a `kind: "button_reply"` row. */
  replyKind?: "button" | "list";
};

export type StatusTimestamps = {
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  failed_at?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function extractMediaFromKapso(
  message: KapsoMessagePayload,
): MessageMediaItem[] {
  const raw = message as KapsoMessagePayload & Record<string, unknown>;
  const type = (message.type ?? "").toLowerCase();
  const items: MessageMediaItem[] = [];

  const pick = (key: string) => {
    const block = asRecord(raw[key]);
    if (!block) return;
    const link =
      (typeof block.link === "string" && block.link) ||
      (typeof block.url === "string" && block.url) ||
      null;
    if (!link) return;
    items.push({
      url: link,
      mime: typeof block.mime_type === "string" ? block.mime_type : undefined,
      name:
        typeof block.filename === "string"
          ? block.filename
          : typeof block.caption === "string"
            ? block.caption
            : undefined,
    });
  };

  if (type === "image") pick("image");
  if (type === "video") pick("video");
  if (type === "audio" || type === "voice") pick("audio");
  if (type === "document") pick("document");
  if (type === "sticker") pick("sticker");

  return items;
}

export function extractFlowFromKapso(
  message: KapsoMessagePayload,
): MessageFlowPayload | null {
  const raw = message as KapsoMessagePayload & Record<string, unknown>;
  const interactive = asRecord(raw.interactive);
  const nfm = asRecord(interactive?.nfm_reply);
  const type = (message.type ?? "").toLowerCase();
  const interactiveType =
    typeof interactive?.type === "string"
      ? interactive.type.toLowerCase()
      : "";

  if (type === "location" && message.location) {
    const lat = Number(message.location.latitude);
    const lng = Number(message.location.longitude);
    return {
      kind: "location",
      title: message.location.name || "Location",
      address: message.location.address || "",
      latitude: Number.isFinite(lat) ? lat : undefined,
      longitude: Number.isFinite(lng) ? lng : undefined,
    };
  }

  // A patient tapping one of our reply buttons or list items. Kept distinct
  // from a real WhatsApp Flow response (nfm_reply, below) — this is what they
  // chose, not a form they filled in.
  if (interactiveType === "button_reply" || interactiveType === "list_reply") {
    const replyKind = interactiveType === "button_reply" ? "button" : "list";
    const tapped = asRecord(interactive?.[`${replyKind}_reply`]);
    const title = typeof tapped?.title === "string" ? tapped.title.trim() : "";
    const buttonId = typeof tapped?.id === "string" ? tapped.id.trim() : "";
    if (!title || !buttonId) return null;
    return { kind: "button_reply", title, buttonId, replyKind };
  }

  // Real WhatsApp Flows (nfm_reply) or explicit flow type only.
  if (type === "flow" || nfm || interactiveType === "nfm_reply") {
    const title =
      (typeof nfm?.name === "string" && nfm.name) ||
      (typeof interactive?.type === "string" && interactive.type) ||
      "WhatsApp Flow";
    return {
      kind: "flow",
      title,
      subtitle:
        typeof nfm?.body === "string"
          ? nfm.body.slice(0, 160)
          : "Interactive flow response",
      cta: "View",
      fields: [],
    };
  }
  return null;
}

export function mediaToJson(items: MessageMediaItem[]): Json {
  return items as unknown as Json;
}

export function flowToJson(flow: MessageFlowPayload | null): Json | null {
  return flow as unknown as Json | null;
}

/** Strip Kapso attachment boilerplate + media URLs from chat text. */
export function sanitizeWhatsappBody(
  body: string,
  messageType?: string,
): string {
  let text = body.replace(/\r\n/g, "\n").trim();
  if (!text) return "";

  const type = (messageType ?? "").toLowerCase();
  if (
    type === "unsupported" ||
    type === "unknown" ||
    /unsupported message/i.test(text) ||
    /error\s*131051/i.test(text)
  ) {
    return "";
  }

  text = text.replace(/https?:\/\/(?:app\.)?kapso\.ai\/\S+/gi, "");
  text = text.replace(/https?:\/\/lookaside\.fbsbx\.com\/\S+/gi, "");
  text = text.replace(/\bURL:\s*/gi, "");
  text = text.replace(
    /^(Image|Video|Audio|Document|Voice|Sticker)\s+attached\s*\([^)]*\)\s*(?:\[[^\]]*\]\s*)*/i,
    "",
  );

  const transcript = text.match(/Transcript:\s*([\s\S]+)$/i);
  if (
    transcript?.[1] &&
    (type === "audio" || type === "voice" || /attached/i.test(body))
  ) {
    return transcript[1].trim();
  }

  return text
    .replace(/^\s*Transcript:\s*/im, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function kapsoMessageBody(message: KapsoMessagePayload): string {
  const type = (message.type ?? "text").toLowerCase();
  if (type === "unsupported" || type === "unknown") {
    return "";
  }
  if (type === "text") {
    return sanitizeWhatsappBody(
      message.text?.body ?? message.kapso?.content ?? "",
      type,
    );
  }

  const raw = message as KapsoMessagePayload & Record<string, unknown>;
  if (type === "interactive") {
    const interactive = asRecord(raw.interactive);
    const buttonReply = asRecord(interactive?.button_reply);
    if (typeof buttonReply?.title === "string" && buttonReply.title.trim()) {
      return buttonReply.title.trim();
    }
    const listReply = asRecord(interactive?.list_reply);
    if (typeof listReply?.title === "string" && listReply.title.trim()) {
      return listReply.title.trim();
    }
  }

  // A voice note's real content is its transcript. Kapso reports it both as a
  // structured field and as a "Transcript:" tail on the display string; prefer
  // the structured one, whose shape is a contract.
  if (type === "audio" || type === "voice") {
    const transcript = extractKapsoTranscript(message.kapso);
    if (transcript) return transcript;
  }

  const block = asRecord(raw[type]);
  const caption =
    typeof block?.caption === "string" ? block.caption.trim() : "";
  if (caption) return sanitizeWhatsappBody(caption, type);

  return sanitizeWhatsappBody(message.kapso?.content ?? "", type);
}

export function isUnsupportedKapsoType(type?: string): boolean {
  const t = (type ?? "").toLowerCase();
  return t === "unsupported" || t === "unknown";
}
