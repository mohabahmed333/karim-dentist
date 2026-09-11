import type { APIRequestContext } from "@playwright/test";
import { inboundTextEvent, signWebhookBody } from "./signWebhook";

/**
 * A distinct number per test, so each gets its own conversation. Sharing one
 * conversation makes "how many AI replies exist" ambiguous across tests.
 */
export function uniquePhone() {
  return `+2010${String(Date.now()).slice(-7)}${Math.floor(Math.random() * 10)}`;
}

/** Deliver a signed inbound text message through the real webhook route. */
export async function deliverInbound(request: APIRequestContext, phone: string, text: string) {
  const body = JSON.stringify(inboundTextEvent({ phone, text }));
  return request.post("/api/v1/whatsapp/webhook", {
    headers: {
      "content-type": "application/json",
      "x-webhook-event": "whatsapp.message.received",
      "x-webhook-signature": signWebhookBody(body),
      "x-idempotency-key": `e2e-${Date.now()}-${Math.random()}`,
    },
    data: body,
  });
}
