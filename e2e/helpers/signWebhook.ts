import { createHmac } from "node:crypto";
import { WEBHOOK_SECRET } from "./env";

/** Mirrors verifyKapsoWebhookSignature: HMAC-SHA256 hex over the raw body. */
export function signWebhookBody(rawBody: string, secret = WEBHOOK_SECRET): string {
  return createHmac("sha256", secret).update(rawBody).digest("hex");
}

export function inboundTextEvent(input: {
  phone: string;
  text: string;
  wamid?: string;
  conversationId?: string;
}) {
  return {
    message: {
      id: input.wamid ?? `wamid.e2e.${Date.now()}.${Math.random().toString(16).slice(2)}`,
      from: input.phone,
      type: "text",
      text: { body: input.text },
      timestamp: String(Math.floor(Date.now() / 1000)),
      kapso: { direction: "inbound", status: "received" },
    },
    conversation: {
      id: input.conversationId,
      phone_number: input.phone,
      contact_name: "E2E Patient",
    },
  };
}

/** A patient tapping a reply button we sent (not a template quick-reply button). */
export function inboundButtonReplyEvent(input: {
  phone: string;
  buttonId: string;
  title: string;
  wamid?: string;
  conversationId?: string;
}) {
  return {
    message: {
      id: input.wamid ?? `wamid.e2e.${Date.now()}.${Math.random().toString(16).slice(2)}`,
      from: input.phone,
      type: "interactive",
      interactive: {
        type: "button_reply",
        button_reply: { id: input.buttonId, title: input.title },
      },
      timestamp: String(Math.floor(Date.now() / 1000)),
      kapso: { direction: "inbound", status: "received" },
    },
    conversation: {
      id: input.conversationId,
      phone_number: input.phone,
      contact_name: "E2E Patient",
    },
  };
}
