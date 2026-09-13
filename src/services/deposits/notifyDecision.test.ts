import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { notifyDepositConfirmed } from "./notifyDecision.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { WhatsappSessionClosedError } from "@/services/whatsapp/sendMessage.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

const CONVERSATION = "conv-1";
const RESERVATION = "res-1";
const NOW = new Date("2026-09-13T12:00:00Z");
/** Inside Meta's 24-hour window, comfortably. */
const RECENT = "2026-09-13T11:00:00Z";
/** The patient wrote yesterday morning; staff are confirming today. */
const STALE = "2026-09-12T09:00:00Z";

function db(overrides: Record<string, unknown[]> = {}) {
  const lastInboundAt = (overrides.__lastInboundAt as unknown as string) ?? RECENT;
  const tables: Record<string, unknown[]> = {
    deposit_requests: [
      {
        id: "req-1",
        conversation_id: CONVERSATION,
        reservation_id: RESERVATION,
        amount_egp: 200,
      },
    ],
    whatsapp_conversations: [
      { id: CONVERSATION, contact_name: "مهاب", last_inbound_at: lastInboundAt },
    ],
    whatsapp_messages: [
      {
        id: "m1",
        conversation_id: CONVERSATION,
        direction: "inbound",
        body: "ده الإيصال",
        wa_timestamp: lastInboundAt,
      },
    ],
    reservations: [
      {
        id: RESERVATION,
        patient_name: "مهاب أحمد",
        service_label: "كشف واستشارة",
        starts_at: "2026-09-15T08:00:00Z",
      },
    ],
    site_settings: [
      { contact_clinic_name: "The Dental Lounge", contact_phone: "", contact_address: "" },
    ],
    patient_notifications: [],
    ...overrides,
  };
  delete tables.__lastInboundAt;
  return createFakeDb({ tables });
}

/** Captures what would have gone out, instead of calling Kapso. */
function spy(onSend?: (input: { text?: string }) => void) {
  const sent: { conversationId: string; text?: string; template?: { name: string; body: unknown[] } }[] = [];
  return {
    sent,
    send: async (input: {
      conversationId: string;
      text?: string;
      template?: { name: string; body: unknown[] };
    }) => {
      onSend?.(input);
      sent.push({
        conversationId: input.conversationId,
        text: input.text,
        template: input.template,
      });
    },
  };
}

describe("notifyDepositConfirmed — inside the 24-hour window", () => {
  /**
   * The bug: staff confirming a receipt in the dashboard was silent. The row
   * moved to paid, the appointment was confirmed, and the patient — who had
   * sent money and was waiting — heard nothing at all.
   */
  it("tells the patient their deposit was accepted", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(db() as never, "req-1", s.send as never, NOW);
    assert.deepEqual(out, { sent: true, via: "text" });
    assert.equal(s.sent.length, 1);
    assert.equal(s.sent[0].conversationId, CONVERSATION);
    assert.match(s.sent[0].text!, /ميعادك مؤكد/);
    assert.equal(s.sent[0].template, undefined);
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
            wa_timestamp: RECENT,
          },
        ],
      }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.match(s.sent[0].text!, /your appointment is confirmed/i);
  });
});

/**
 * Staff confirm the morning after a transfer as often as they confirm within
 * the hour, and by then Meta refuses free text outright — so the one message
 * the patient most needs is the one most likely to be blocked. The clinic's
 * approved confirmation template is the only thing that still reaches them.
 */
describe("notifyDepositConfirmed — after the window has closed", () => {
  const closed = () => db({ __lastInboundAt: STALE as never });

  /**
   * Confirming the deposit flips the reservation to `confirmed`, and the
   * notification trigger queues the clinic's approved confirmation template on
   * exactly that transition. Sending our own copy as well is the same template
   * twice, to a patient who is already being told.
   */
  it("stays quiet when the pipeline already holds the confirmation", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(
      db({
        __lastInboundAt: STALE as never,
        patient_notifications: [
          {
            id: "n1",
            reservation_id: RESERVATION,
            kind: "confirmation",
            status: "pending",
          },
        ],
      }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.deepEqual(out, { sent: false, reason: "confirmation_queued" });
    assert.equal(s.sent.length, 0);
  });

  /** A confirmation the pipeline gave up on is not a confirmation. */
  it("still speaks when the queued confirmation was superseded", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(
      db({
        __lastInboundAt: STALE as never,
        patient_notifications: [
          {
            id: "n1",
            reservation_id: RESERVATION,
            kind: "confirmation",
            status: "superseded",
          },
        ],
      }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.deepEqual(out, { sent: true, via: "template" });
  });

  it("sends the approved template instead of free text", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(closed() as never, "req-1", s.send as never, NOW);
    assert.deepEqual(out, { sent: true, via: "template" });
    assert.equal(s.sent[0].text, undefined);
    assert.ok(s.sent[0].template, "a template should have been sent");
  });

  it("sends the Arabic template when the chat is in Arabic", async () => {
    const s = spy();
    await notifyDepositConfirmed(closed() as never, "req-1", s.send as never, NOW);
    assert.equal(s.sent[0].template!.name, "appoinment_ar");
  });

  it("sends the English template when the chat is in English", async () => {
    const s = spy();
    await notifyDepositConfirmed(
      db({
        __lastInboundAt: STALE as never,
        whatsapp_messages: [
          {
            id: "m1",
            conversation_id: CONVERSATION,
            direction: "inbound",
            body: "here is the receipt, thanks",
            wa_timestamp: STALE,
          },
        ],
      }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.equal(s.sent[0].template!.name, "appoinment_en");
  });

  /** The approved body is positional: name, clinic, when, service. */
  it("fills the template from the reservation, not from the model", async () => {
    const s = spy();
    await notifyDepositConfirmed(closed() as never, "req-1", s.send as never, NOW);
    const body = s.sent[0].template!.body as { text: string }[];
    assert.deepEqual(body.map((p) => p.text).slice(0, 2), ["مهاب أحمد", "The Dental Lounge"]);
    assert.match(body[2].text, /2026/);
    assert.equal(body[3].text, "كشف واستشارة");
  });

  /**
   * Without a real appointment time there is no honest template to send, and
   * inventing one is worse than staff having to phone.
   */
  it("reports rather than invents when the booking has gone", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(
      db({ __lastInboundAt: STALE as never, reservations: [] }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.deepEqual(out, { sent: false, reason: "no_template" });
    assert.equal(s.sent.length, 0);
  });

  /**
   * The window can shut between reading it and sending — an inbound webhook we
   * have not stored yet, or a clock a minute out. The template answers exactly
   * that refusal, so it is worth one attempt before giving up.
   */
  it("falls back to the template when a send is refused as expired", async () => {
    let first = true;
    const s = spy(() => {
      if (first) {
        first = false;
        throw new WhatsappSessionClosedError();
      }
    });
    const out = await notifyDepositConfirmed(db() as never, "req-1", s.send as never, NOW);
    assert.deepEqual(out, { sent: true, via: "template" });
    assert.equal(s.sent.length, 1);
    assert.ok(s.sent[0].template);
  });
});

describe("notifyDepositConfirmed — when there is nobody to tell", () => {
  /** A deposit taken over the phone has no thread to answer into. */
  it("reports when there is no WhatsApp conversation to reply to", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(
      db({
        deposit_requests: [
          { id: "req-1", conversation_id: null, reservation_id: RESERVATION, amount_egp: 200 },
        ],
      }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.deepEqual(out, { sent: false, reason: "no_conversation" });
    assert.equal(s.sent.length, 0);
  });

  it("reports an unknown request rather than throwing", async () => {
    const out = await notifyDepositConfirmed(
      db() as never,
      "does-not-exist",
      spy().send as never,
      NOW,
    );
    assert.deepEqual(out, { sent: false, reason: "not_found" });
  });

  /** A thread with no inbound message at all is outside the window by definition. */
  it("uses the template for a thread the patient has never written in", async () => {
    const s = spy();
    const out = await notifyDepositConfirmed(
      db({
        __lastInboundAt: null as never,
        whatsapp_messages: [],
        whatsapp_conversations: [
          { id: CONVERSATION, contact_name: "مهاب", last_inbound_at: null },
        ],
      }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.deepEqual(out, { sent: true, via: "template" });
  });

  /** "ok" copy carries no figure, so a missing amount cannot print "0 EGP". */
  it("says nothing about the amount when the row has none", async () => {
    const s = spy();
    await notifyDepositConfirmed(
      db({
        deposit_requests: [
          {
            id: "req-1",
            conversation_id: CONVERSATION,
            reservation_id: RESERVATION,
            amount_egp: null,
          },
        ],
      }) as never,
      "req-1",
      s.send as never,
      NOW,
    );
    assert.equal(s.sent.length, 1);
    assert.doesNotMatch(s.sent[0].text!, /\b0\b/);
  });
});

/**
 * The confirmation is already committed by the time this runs, so neither a
 * failed send nor a failed lookup may surface as a thrown error — staff would
 * read it as a confirmation that did not happen, and click again.
 */
describe("notifyDepositConfirmed — failures are reported, never raised", () => {
  it("reports rather than throws when the lookup itself fails", async () => {
    const broken = {
      from() {
        throw new Error("connection terminated");
      },
    };
    const out = await notifyDepositConfirmed(
      broken as never,
      "req-1",
      spy().send as never,
      NOW,
    );
    assert.deepEqual(out, { sent: false, reason: "lookup_failed" });
  });

  it("never throws when the send fails", async () => {
    const out = await notifyDepositConfirmed(
      db() as never,
      "req-1",
      (async () => {
        throw new Error("Kapso is down");
      }) as never,
      NOW,
    );
    assert.deepEqual(out, { sent: false, reason: "send_failed" });
  });

  it("never throws when the template send fails too", async () => {
    const out = await notifyDepositConfirmed(
      db({ __lastInboundAt: STALE as never }) as never,
      "req-1",
      (async () => {
        throw new Error("Template paused by Meta");
      }) as never,
      NOW,
    );
    assert.deepEqual(out, { sent: false, reason: "send_failed" });
  });
});
