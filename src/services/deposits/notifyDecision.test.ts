import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { notifyDepositConfirmed } from "./notifyDecision.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

const CONVERSATION = "conv-1";

function db(overrides: Record<string, unknown[]> = {}) {
  return createFakeDb({
    tables: {
      deposit_requests: [
        { id: "req-1", conversation_id: CONVERSATION, amount_egp: 200 },
      ],
      whatsapp_conversations: [{ id: CONVERSATION, contact_name: "مهاب" }],
      whatsapp_messages: [
        {
          id: "m1",
          conversation_id: CONVERSATION,
          direction: "inbound",
          body: "ده الإيصال",
          wa_timestamp: "2026-09-13T12:00:00Z",
        },
      ],
      ...overrides,
    },
  });
}

/** Captures what would have gone out, instead of calling Kapso. */
function spy() {
  const sent: { conversationId: string; text: string }[] = [];
  return {
    sent,
    send: async (input: { conversationId: string; text: string }) => {
      sent.push({ conversationId: input.conversationId, text: input.text });
    },
  };
}

describe("notifyDepositConfirmed", () => {
  /**
   * The bug: staff confirming a receipt in the dashboard was silent. The row
   * moved to paid, the appointment was confirmed, and the patient — who had
   * sent money and was waiting — heard nothing at all.
   */
  it("tells the patient their deposit was accepted", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(db() as never, "req-1", s.send as never);
    assert.deepEqual(out, { sent: true });
    assert.equal(s.sent.length, 1);
    assert.equal(s.sent[0].conversationId, CONVERSATION);
    assert.match(s.sent[0].text, /ميعادك مؤكد/);
  });

  it("answers in English when that is what the patient wrote", async () => {
    const s = spy();
    await notifyDepositConfirmed(
      db({
        whatsapp_messages: [
          {
            id: "m1",
            conversation_id: CONVERSATION,
            direction: "inbound",
            body: "here is the receipt",
            wa_timestamp: "2026-09-13T12:00:00Z",
          },
        ],
      }) as never,
      "req-1",
      s.send as never,
    );
    assert.match(s.sent[0].text, /your appointment is confirmed/i);
  });

  /** A deposit taken over the phone has no thread to answer into. */
  it("reports when there is no WhatsApp conversation to reply to", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(
      db({ deposit_requests: [{ id: "req-1", conversation_id: null, amount_egp: 200 }] }) as never,
      "req-1",
      s.send as never,
    );
    assert.deepEqual(out, { sent: false, reason: "no_conversation" });
    assert.equal(s.sent.length, 0);
  });

  it("reports an unknown request rather than throwing", async () => {
    const out = await notifyDepositConfirmed(db() as never, "does-not-exist", spy().send as never);
    assert.deepEqual(out, { sent: false, reason: "not_found" });
  });

  /**
   * The confirmation is already committed by the time this runs. Outside
   * Meta's 24-hour window the send genuinely fails, and that must not read to
   * staff as a failed confirmation.
   */
  it("never throws when the send fails", async () => {
    const out = await notifyDepositConfirmed(
      db() as never,
      "req-1",
      (async () => {
        throw new Error("Customer care window expired");
      }) as never,
    );
    assert.deepEqual(out, { sent: false, reason: "send_failed" });
  });
});
