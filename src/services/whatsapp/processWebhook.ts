import type {
  KapsoConversationPayload,
  KapsoMessagePayload,
  KapsoWebhookBody,
} from "./types";
import {
  claimWebhookEvent,
  updateMessageStatusByWamid,
  upsertConversationFromKapso,
  upsertMessageFromKapso,
} from "./mutations";
import { kapsoMessageBody, isUnsupportedKapsoType } from "./messageMedia";
import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

function directionOf(message: KapsoMessagePayload): "inbound" | "outbound" {
  const d = message.kapso?.direction?.toLowerCase();
  if (d === "outbound") return "outbound";
  return "inbound";
}

function messageStatusOf(
  direction: "inbound" | "outbound",
  status?: string,
): string {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "failed") return "failed";
  if (s === "read") return "read";
  if (s === "delivered") return "delivered";
  if (s === "sent") return "sent";
  return direction === "inbound" ? "received" : "sent";
}

function messageTypeOf(message: KapsoMessagePayload): string {
  if (isUnsupportedKapsoType(message.type)) return "unsupported";
  return (message.type ?? "text").toLowerCase();
}

function messagePreview(message: KapsoMessagePayload): string {
  if (isUnsupportedKapsoType(message.type)) {
    return "Unsupported message";
  }
  const body = kapsoMessageBody(message);
  if (body) return body.slice(0, 240);
  const type = messageTypeOf(message);
  if (type === "image" || type === "sticker") return "Photo";
  if (type === "audio" || type === "voice") return "Voice message";
  if (type === "video") return "Video";
  if (type === "document") return "Document";
  if (type === "flow" || type === "interactive") return "Form";
  if (type === "location") return "Location";
  if (type === "contacts") return "Contact";
  return `[${type}]`;
}

async function handleMessageEvent(
  supabase: ServiceClient,
  event: string,
  payload: KapsoWebhookBody,
): Promise<void> {
  const message = payload.message;
  const conversation = payload.conversation;
  if (!message) return;

  if (
    event === "whatsapp.message.delivered" ||
    event === "whatsapp.message.read" ||
    event === "whatsapp.message.failed" ||
    event === "whatsapp.message.sent"
  ) {
    if (message.id) {
      const status =
        event === "whatsapp.message.delivered"
          ? "delivered"
          : event === "whatsapp.message.read"
            ? "read"
            : event === "whatsapp.message.failed"
              ? "failed"
              : "sent";
      await updateMessageStatusByWamid(supabase, message.id, status);
    }
    return;
  }

  if (event !== "whatsapp.message.received" && event !== "whatsapp.message.sent") {
    return;
  }

  const direction = directionOf(message);
  const conv = await upsertConversationFromKapso(
    supabase,
    conversation ?? {
      phone_number: message.from,
    },
    {
      preview: messagePreview(message),
      messageType: messageTypeOf(message),
      messageStatus: messageStatusOf(direction, message.kapso?.status),
      at: message.timestamp
        ? new Date(
            /^\d+$/.test(message.timestamp)
              ? Number(message.timestamp) * 1000
              : message.timestamp,
          ).toISOString()
        : new Date().toISOString(),
      bumpUnread: direction === "inbound",
    },
  );
  await upsertMessageFromKapso(supabase, conv.id, message, direction);
}

async function handleConversationEvent(
  supabase: ServiceClient,
  event: string,
  payload: KapsoWebhookBody,
): Promise<void> {
  const conversation = payload.conversation as KapsoConversationPayload | undefined;
  if (!conversation) return;
  await upsertConversationFromKapso(supabase, {
    ...conversation,
    status: event === "whatsapp.conversation.ended" ? "ended" : "active",
  });
}

export async function processKapsoWebhook(
  supabase: ServiceClient,
  event: string,
  idempotencyKey: string,
  body: KapsoWebhookBody,
): Promise<"ok" | "duplicate"> {
  const claimed = await claimWebhookEvent(supabase, idempotencyKey, event);
  if (!claimed) return "duplicate";

  const payloads =
    body.batch && Array.isArray(body.data) ? body.data : [body];

  for (const payload of payloads) {
    if (event.startsWith("whatsapp.message.")) {
      await handleMessageEvent(supabase, event, payload);
    } else if (event.startsWith("whatsapp.conversation.")) {
      await handleConversationEvent(supabase, event, payload);
    }
  }

  return "ok";
}
