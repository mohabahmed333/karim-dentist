import type { Json } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";
import {
  extractFlowFromKapso,
  extractMediaFromKapso,
  flowToJson,
  kapsoMessageBody,
  mediaToJson,
  type MessageFlowPayload,
  type MessageMediaItem,
} from "./messageMedia";
import {
  extractReplyContext,
  previewForReplyBody,
  replyToJson,
  type MessageReplyTo,
} from "./messageReply";
import { resolvePatientKeyByPhone } from "./patientLink";
import { resolveConversationStatus } from "./resolveConversationStatus";
import type {
  KapsoConversationPayload,
  KapsoMessagePayload,
  WhatsappConversation,
} from "./types";

type ServiceClient = ReturnType<typeof createServiceClient>;

function parseWaTimestamp(raw?: string): string {
  if (!raw) return new Date().toISOString();
  if (/^\d+$/.test(raw)) {
    return new Date(Number(raw) * 1000).toISOString();
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

function messageBody(message: KapsoMessagePayload): string {
  return kapsoMessageBody(message);
}

function mapStatus(
  direction: "inbound" | "outbound",
  status?: string,
): "pending" | "received" | "sent" | "delivered" | "read" | "failed" {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "failed") return "failed";
  if (s === "read") return "read";
  if (s === "delivered") return "delivered";
  if (s === "sent") return "sent";
  return direction === "inbound" ? "received" : "sent";
}

function statusTimestampPatch(
  status: "sent" | "delivered" | "read" | "failed",
  existing: Record<string, unknown> = {},
) {
  const now = new Date().toISOString();
  const key =
    status === "sent"
      ? "sent_at"
      : status === "delivered"
        ? "delivered_at"
        : status === "read"
          ? "read_at"
          : "failed_at";
  return { ...existing, [key]: now };
}

export async function claimWebhookEvent(
  supabase: ServiceClient,
  idempotencyKey: string,
  event: string,
): Promise<boolean> {
  const { error } = await supabase.from("whatsapp_webhook_events").insert({
    idempotency_key: idempotencyKey,
    event,
  });
  if (error) {
    if (error.code === "23505") return false;
    throw error;
  }
  return true;
}

export async function upsertConversationFromKapso(
  supabase: ServiceClient,
  conversation: KapsoConversationPayload,
  extras?: {
    preview?: string;
    messageType?: string;
    messageStatus?: string;
    at?: string;
    bumpUnread?: boolean;
    /** ISO timestamp of inbound message — updates last_inbound_at. */
    lastInboundAt?: string;
  },
): Promise<WhatsappConversation> {
  const kapsoId = conversation.id ?? null;
  const phone = conversation.phone_number ?? "";
  let existing: WhatsappConversation | null = null;

  if (kapsoId) {
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("kapso_conversation_id", kapsoId)
      .maybeSingle();
    existing = data;
  }
  if (!existing && phone) {
    const { data } = await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq("phone_number", phone)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  const patientKey =
    existing?.patient_key ??
    (phone ? await resolvePatientKeyByPhone(supabase, phone) : null);

  const patch = {
    kapso_conversation_id: kapsoId ?? existing?.kapso_conversation_id ?? null,
    phone_number: phone || existing?.phone_number || "unknown",
    contact_name: conversation.contact_name ?? existing?.contact_name ?? null,
    patient_key: patientKey,
    status: resolveConversationStatus({
      existing: existing?.status,
      requested: conversation.status,
      bumpUnread: extras?.bumpUnread,
    }),
    last_message_at: extras?.at ?? existing?.last_message_at ?? null,
    last_inbound_at:
      extras?.lastInboundAt ?? existing?.last_inbound_at ?? null,
    last_message_preview:
      extras?.preview ?? existing?.last_message_preview ?? "",
    last_message_type:
      extras?.messageType ?? existing?.last_message_type ?? "text",
    last_message_status:
      extras?.messageStatus ?? existing?.last_message_status ?? "received",
    unread_count: extras?.bumpUnread
      ? (existing?.unread_count ?? 0) + 1
      : (existing?.unread_count ?? 0),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("whatsapp_conversations")
      .update(patch)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .insert(patch)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function upsertMessageFromKapso(
  supabase: ServiceClient,
  conversationId: string,
  message: KapsoMessagePayload,
  direction: "inbound" | "outbound",
): Promise<void> {
  const wamid = message.id ?? null;
  const body = messageBody(message);
  const status = mapStatus(direction, message.kapso?.status);
  const waTimestamp = parseWaTimestamp(message.timestamp);
  const media = extractMediaFromKapso(message);
  const flow = extractFlowFromKapso(message);
  const replyCtx = extractReplyContext(message);
  let replyTo: MessageReplyTo | null = null;
  if (replyCtx) {
    const [{ data: quoted }, { data: conv }] = await Promise.all([
      supabase
        .from("whatsapp_messages")
        .select("body, message_type, direction")
        .eq("kapso_wamid", replyCtx.wamid)
        .maybeSingle(),
      supabase
        .from("whatsapp_conversations")
        .select("contact_name, phone_number")
        .eq("id", conversationId)
        .maybeSingle(),
    ]);
    const patientLabel =
      conv?.contact_name?.trim() ||
      conv?.phone_number ||
      "Patient";
    replyTo = {
      wamid: replyCtx.wamid,
      authorName:
        quoted?.direction === "outbound" ? "Front desk" : patientLabel,
      body: previewForReplyBody(quoted?.body, quoted?.message_type),
      messageType: quoted?.message_type,
    };
  }
  const outboundStamp: "sent" | "delivered" | "read" | "failed" =
    status === "failed"
      ? "failed"
      : status === "delivered"
        ? "delivered"
        : status === "read"
          ? "read"
          : "sent";
  const statusTimestamps =
    direction === "outbound" ? statusTimestampPatch(outboundStamp) : {};
  const row = {
    conversation_id: conversationId,
    kapso_wamid: wamid,
    direction,
    body,
    message_type: message.type ?? "text",
    status,
    raw: message as unknown as Json,
    media: mediaToJson(media),
    flow: flowToJson(flow),
    reply_to: replyToJson(replyTo),
    status_timestamps: statusTimestamps as Json,
    wa_timestamp: waTimestamp,
    updated_at: new Date().toISOString(),
  };

  if (wamid) {
    const { data: existing } = await supabase
      .from("whatsapp_messages")
      .select("id")
      .eq("kapso_wamid", wamid)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from("whatsapp_messages")
        .update(row)
        .eq("id", existing.id);
      if (error) throw error;
      return;
    }
  }

  const { error } = await supabase.from("whatsapp_messages").insert(row);
  if (error) throw error;
}

export async function updateMessageStatusByWamid(
  supabase: ServiceClient,
  wamid: string,
  status: "sent" | "delivered" | "read" | "failed",
): Promise<void> {
  const { data: existing } = await supabase
    .from("whatsapp_messages")
    .select("id, conversation_id, status_timestamps")
    .eq("kapso_wamid", wamid)
    .maybeSingle();

  const prev =
    existing?.status_timestamps &&
    typeof existing.status_timestamps === "object" &&
    !Array.isArray(existing.status_timestamps)
      ? (existing.status_timestamps as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from("whatsapp_messages")
    .update({
      status,
      status_timestamps: statusTimestampPatch(status, prev) as Json,
      updated_at: new Date().toISOString(),
    })
    .eq("kapso_wamid", wamid);
  if (error) throw error;

  if (!existing?.conversation_id) return;
  const { data: latest } = await supabase
    .from("whatsapp_messages")
    .select("id")
    .eq("conversation_id", existing.conversation_id)
    .order("wa_timestamp", { ascending: false })
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latest?.id !== existing.id) return;

  await supabase
    .from("whatsapp_conversations")
    .update({
      last_message_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existing.conversation_id);
}

export async function insertOutboundMessage(
  supabase: ServiceClient,
  input: {
    conversationId: string;
    body: string;
    sentBy: string | null;
    wamid?: string | null;
    status?: "sent" | "failed";
    messageType?: string;
    media?: MessageMediaItem[];
    flow?: MessageFlowPayload | null;
    replyTo?: MessageReplyTo | null;
    preview?: string;
  },
) {
  const now = new Date().toISOString();
  const status = input.status ?? "sent";
  const messageType = input.messageType ?? "text";
  const preview =
    (input.preview ?? input.body).slice(0, 240) ||
    previewForType(messageType);

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .insert({
      conversation_id: input.conversationId,
      kapso_wamid: input.wamid ?? null,
      direction: "outbound",
      body: input.body,
      message_type: messageType,
      status,
      sent_by: input.sentBy,
      media: mediaToJson(input.media ?? []),
      flow: flowToJson(input.flow ?? null),
      reply_to: replyToJson(input.replyTo ?? null),
      wa_timestamp: now,
      status_timestamps: statusTimestampPatch(
        status === "failed" ? "failed" : "sent",
      ) as Json,
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase
    .from("whatsapp_conversations")
    .update({
      last_message_at: data.wa_timestamp,
      last_message_preview: preview.slice(0, 240),
      last_message_type: messageType,
      last_message_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.conversationId);

  return data;
}

function previewForType(type: string): string {
  const t = type.toLowerCase();
  if (t === "image" || t === "sticker") return "Photo";
  if (t === "audio" || t === "voice") return "Voice message";
  if (t === "video") return "Video";
  if (t === "document") return "Document";
  if (t === "location") return "Location";
  if (t === "contacts") return "Contact";
  if (t === "interactive" || t === "button" || t === "cta") return "Form";
  return "Message";
}

export async function clearConversationUnread(
  supabase: ServiceClient,
  conversationId: string,
): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_conversations")
    .update({ unread_count: 0, updated_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (error) throw error;
}

export async function setConversationStatus(
  supabase: ServiceClient,
  conversationId: string,
  status: "active" | "archived",
): Promise<WhatsappConversation> {
  const { data, error } = await supabase
    .from("whatsapp_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}
