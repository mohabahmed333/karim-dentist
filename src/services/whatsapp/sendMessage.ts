import type { WhatsAppClient } from "@kapso/whatsapp-cloud-api";
import { clinicContactFromSettings } from "@/lib/clinic/whatsappClinicContact";
import type { createServiceClient } from "@/lib/supabase/service";
import { getConversation } from "./queries";
import { insertOutboundMessage } from "./mutations";
import { isWhatsappSessionOpen, latestInboundAt } from "./sessionWindow";
import {
  checkInteractiveButtons,
  checkInteractiveList,
  type InteractiveList,
} from "./interactiveButtons";
import { sendKapsoPayload, type TemplateSendInput } from "./sendKapso";
import type { WhatsappMessage } from "./types";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Thrown when the Meta 24h customer-care window has closed. */
export class WhatsappSessionClosedError extends Error {
  readonly code = "SESSION_EXPIRED";
  constructor() {
    super("Customer care window expired");
    this.name = "WhatsappSessionClosedError";
  }
}

export type SendTextInput = {
  service: ServiceClient;
  client: WhatsAppClient;
  phoneNumberId: string;
  conversationId: string;
  /** Null for messages the AI sent without a human pressing send. */
  sentBy: string | null;
  /** 'ai' for assistant-authored sends, including drafts a human approved. */
  senderKind?: "human" | "ai" | "system";
  text?: string;
  template?: TemplateSendInput;
  /** Reply buttons to send beneath the text. Ignored for templates. */
  buttons?: { id: string; title: string }[];
  /** A list of choices — for more than three, or names too long for a button. */
  list?: InteractiveList;
  contextMessageId?: string;
};

/**
 * Send a text or template into a conversation and persist it.
 *
 * Shared by the front-desk send route and the admin AI's whatsapp.* actions so
 * the 24h-window rule is enforced in exactly one place. Free text outside the
 * window is a Meta policy violation, not merely an error we can retry, so this
 * throws rather than silently downgrading to a template.
 */
export async function sendWhatsappMessage(
  input: SendTextInput,
): Promise<WhatsappMessage> {
  const conversation = await getConversation(input.service, input.conversationId);
  if (!conversation) throw new Error("Conversation not found");

  const isTemplate = Boolean(input.template);

  if (!isTemplate) {
    const { data: lastInbound } = await input.service
      .from("whatsapp_messages")
      .select("wa_timestamp")
      .eq("conversation_id", input.conversationId)
      .eq("direction", "inbound")
      .order("wa_timestamp", { ascending: false })
      .limit(1)
      .maybeSingle();

    const openUntil = latestInboundAt(conversation.last_inbound_at, [
      lastInbound?.wa_timestamp,
    ]);
    if (!isWhatsappSessionOpen(openUntil)) throw new WhatsappSessionClosedError();
  }

  const { data: settings } = await input.service
    .from("site_settings")
    .select("contact_phone, contact_address, contact_clinic_name")
    .limit(1)
    .maybeSingle();

  // Something tappable improves a message; it is never a precondition for it.
  // If WhatsApp would refuse the set, the words go out alone — a patient
  // reading the times is a far better outcome than a patient reading nothing.
  const list =
    !isTemplate && input.list?.rows.length
      ? checkInteractiveList(input.text ?? "", input.list)
        ? undefined
        : input.list
      : undefined;
  const buttons =
    !isTemplate && !list && input.buttons?.length
      ? checkInteractiveButtons(input.text ?? "", input.buttons)
        ? undefined
        : input.buttons
      : undefined;

  const sent = await sendKapsoPayload({
    client: input.client,
    phoneNumberId: input.phoneNumberId,
    to: conversation.phone_number.replace(/\D/g, ""),
    kind: isTemplate
      ? "template"
      : list
        ? "interactive_list"
        : buttons
          ? "interactive_buttons"
          : "text",
    text: input.text ?? "",
    buttons,
    list,
    template: input.template,
    clinic: clinicContactFromSettings(settings),
    contextMessageId: input.contextMessageId,
  });

  return insertOutboundMessage(input.service, {
    conversationId: conversation.id,
    body: sent.body,
    sentBy: input.sentBy,
    senderKind: input.senderKind ?? "human",
    wamid: sent.wamid,
    status: "sent",
    messageType: sent.messageType,
    media: sent.media,
    flow: sent.flow,
    preview: sent.preview,
  });
}
