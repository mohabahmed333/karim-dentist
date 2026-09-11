import { expect, test } from "@playwright/test";
import { deliverInbound, uniquePhone } from "./helpers/inbound";
import {
  conversationByPhone,
  messagesFor,
  seedE2E,
  setAiMode,
} from "./helpers/seed";
import { inboundTextEvent, signWebhookBody } from "./helpers/signWebhook";

/** Poll, because the reply is produced in after() once the response is sent. */
async function waitForOutbound(
  conversationId: string,
  predicate: (m: Record<string, unknown>) => boolean,
  timeoutMs = 25_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const messages = await messagesFor(conversationId);
    const hit = messages.find(predicate);
    if (hit) return hit;
    await new Promise((r) => setTimeout(r, 750));
  }
  return null;
}

test.describe("WhatsApp auto-responder", () => {
  test.beforeEach(async () => {
    await seedE2E();
  });

  test("rejects an unsigned webhook", async ({ request }) => {
    const res = await request.post("/api/v1/whatsapp/webhook", {
      headers: {
        "content-type": "application/json",
        "x-webhook-event": "whatsapp.message.received",
        "x-webhook-signature": "not-a-real-signature",
      },
      data: JSON.stringify(inboundTextEvent({ phone: uniquePhone(), text: "hi" })),
    });
    expect(res.status()).toBe(401);
  });

  test("stays silent while the responder is off", async ({ request }) => {
    await setAiMode("off");
    const phone = uniquePhone();
    const res = await deliverInbound(request, phone, "what time do you open?");
    expect(res.ok()).toBeTruthy();

    const conversation = await conversationByPhone(phone);
    expect(conversation, "inbound message should still be ingested").not.toBeNull();

    const reply = await waitForOutbound(
      conversation!.id,
      (m) => m.sender_kind === "ai",
      6000,
    );
    expect(reply, "no AI message should exist when mode is off").toBeNull();
  });

  test("auto-sends a safe informational answer", async ({ request }) => {
    await setAiMode("auto");
    const phone = uniquePhone();
    await deliverInbound(request, phone, "what time do you open?");

    const conversation = await conversationByPhone(phone);
    const reply = await waitForOutbound(
      conversation!.id,
      (m) => m.sender_kind === "ai" && m.status === "sent",
    );
    expect(reply, "an hours question should be answered automatically").not.toBeNull();
    expect(String(reply!.body)).toMatch(/10am/i);
  });

  /** The core safety property, end to end. */
  test("drafts a clinical question instead of answering it", async ({ request }) => {
    await setAiMode("auto");
    const phone = uniquePhone();
    await deliverInbound(request, phone, "my tooth really hurts, what should I take?");

    const conversation = await conversationByPhone(phone);
    const draft = await waitForOutbound(
      conversation!.id,
      (m) => m.status === "draft",
    );
    expect(draft, "a clinical question must produce a draft").not.toBeNull();

    const messages = await messagesFor(conversation!.id);
    const sentClinical = messages.find(
      (m) => m.status === "sent" && /dentist should look/i.test(String(m.body)),
    );
    expect(sentClinical, "clinical advice must never be sent").toBeUndefined();
  });

  test("a draft does not become the conversation preview", async ({ request }) => {
    await setAiMode("auto");
    const phone = uniquePhone();
    await deliverInbound(request, phone, "my tooth aches badly");

    const conversation = await conversationByPhone(phone);
    await waitForOutbound(conversation!.id, (m) => m.status === "draft");

    const { data } = await (await import("./helpers/seed"))
      .serviceClient()
      .from("whatsapp_conversations")
      .select("last_message_preview,last_message_status")
      .eq("id", conversation!.id)
      .maybeSingle();

    // The patient's own message is the last thing that actually happened.
    expect(data?.last_message_status).not.toBe("draft");
  });

  test("answers a given inbound message only once, even if redelivered", async ({
    request,
  }) => {
    await setAiMode("auto");
    const phone = uniquePhone();
    const body = JSON.stringify(
      inboundTextEvent({ phone, text: "where are you located?" }),
    );
    const headers = {
      "content-type": "application/json",
      "x-webhook-event": "whatsapp.message.received",
      "x-webhook-signature": signWebhookBody(body),
      "x-idempotency-key": `e2e-dup-${Date.now()}`,
    };

    await request.post("/api/v1/whatsapp/webhook", { headers, data: body });
    const conversation = await conversationByPhone(phone);
    await waitForOutbound(
      conversation!.id,
      (m) => m.sender_kind === "ai" && m.status === "sent",
    );

    // Same wamid, fresh idempotency key: Kapso redelivering the message.
    await request.post("/api/v1/whatsapp/webhook", {
      headers: { ...headers, "x-idempotency-key": `e2e-dup2-${Date.now()}` },
      data: body,
    });
    await new Promise((r) => setTimeout(r, 4000));

    const messages = await messagesFor(conversation!.id);
    const aiSends = messages.filter(
      (m) => m.sender_kind === "ai" && m.status === "sent",
    );
    expect(aiSends.length, "a redelivered message must not be answered twice").toBe(1);
  });
});
