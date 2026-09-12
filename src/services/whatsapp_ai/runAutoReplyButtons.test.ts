import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { runAutoReply } from "./runAutoReply.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { DEFAULT_AI_SETTINGS } from "./types.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { CHANGE_ID, CONFIRM_ID } from "./bookingButtons.ts";

const SLOT_A = "11111111-1111-4111-8111-111111111111";
const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000).toISOString();

type Button = { id: string; title: string };

/**
 * Drives the real pipeline and records what reached the send, because the
 * question these tests answer is what the patient's phone receives.
 */
function harness(options: {
  reply: Record<string, unknown>;
  allowBookingWrites?: boolean;
  mode?: string;
  pendingSlotId?: string;
  inboundText?: string;
  messageType?: string;
}) {
  const sent: { text: string; buttons: Button[] }[] = [];
  const drafts: { text: string; reason: string; buttons: Button[] }[] = [];
  const inboundText = options.inboundText ?? "المواعيد المتاحة؟";

  const deps = {
    conversationId: "conv-1",
    inboundText,
    policy: {
      settings: {
        ...DEFAULT_AI_SETTINGS,
        mode: options.mode ?? "auto",
        allow_booking_writes: options.allowBookingWrites ?? true,
      },
      state: null,
      conversation: { status: "active", last_inbound_at: minutesAgo(1) },
      inbound: { message_type: options.messageType ?? "text", body: inboundText },
      counts: { conversationLastHour: 0, globalLastHour: 0 },
      lastHumanOutboundAt: null,
      hasAiKey: true,
    },
    prompt: {
      basePrompt: "# Front desk",
      slots: [{ id: SLOT_A, starts_at: "2026-09-13T07:30:00.000Z" }],
      clinic: { name: "The Dental Lounge" },
      services: [],
      patient: { name: "Ali", known: true },
      reservations: [],
      history: [{ role: "user" as const, content: inboundText }],
    },
    bookingState: options.pendingSlotId
      ? {
          step: "collecting",
          pending: { slotId: options.pendingSlotId },
          expiresAt: null,
        }
      : null,
    async saveBookingState() {},
    async chat() {
      return JSON.stringify(options.reply);
    },
    async send(text: string, buttons?: Button[]) {
      sent.push({ text, buttons: buttons ?? [] });
      return { id: "sent-1" };
    },
    async draft(text: string, reason: string, buttons?: Button[]) {
      drafts.push({ text, reason, buttons: buttons ?? [] });
      return { id: "draft-1" };
    },
    async runActions() {
      return { ok: true, message: "done" };
    },
    async rememberOfferedSlots() {},
    async record() {},
  };

  return { deps, sent, drafts };
}

const offering = {
  language: "ar",
  intent: "booking_availability",
  confidence: 0.95,
  reply: "متاح الأحد 10:30. تحب أحجزه؟",
  offeredSlotIds: [SLOT_A],
};

describe("runAutoReply — booking buttons", () => {
  it("sends the offered times as buttons the patient can tap", async () => {
    const h = harness({ reply: offering });
    const out = await runAutoReply(h.deps);
    assert.equal(out.status, "sent");
    assert.equal(h.sent.length, 1);
    assert.deepEqual(
      h.sent[0].buttons.map((b) => b.id),
      [`slot:${SLOT_A}`],
    );
    // The id is the payload; the title is what a patient reads.
    assert.doesNotMatch(h.sent[0].buttons[0].title, /[0-9a-f]{8}-/i);
  });

  it("offers confirming once the patient has chosen a time", async () => {
    const h = harness({
      pendingSlotId: SLOT_A,
      inboundText: "الأحد 10:30 ص",
      messageType: "interactive",
      reply: {
        language: "ar",
        intent: "booking_request",
        confidence: 0.95,
        reply: "تمام، أأكد الأحد 10:30؟",
      },
    });
    const out = await runAutoReply(h.deps);
    assert.equal(out.status, "sent");
    assert.deepEqual(
      h.sent[0].buttons.map((b) => b.id),
      [CONFIRM_ID, CHANGE_ID],
    );
  });

  /** A confirm button that cannot book is a lie the patient taps. */
  it("offers no confirm button when booking writes are off", async () => {
    const h = harness({
      pendingSlotId: SLOT_A,
      allowBookingWrites: false,
      reply: {
        language: "ar",
        intent: "booking_request",
        confidence: 0.95,
        reply: "تمام، هيأكدلك زميل من العيادة.",
      },
    });
    await runAutoReply(h.deps);
    assert.deepEqual(h.sent[0].buttons, []);
  });

  it("keeps the buttons on a draft, so approving sends the same message", async () => {
    const h = harness({ mode: "draft_only", reply: offering });
    const out = await runAutoReply(h.deps);
    assert.equal(out.status, "drafted");
    assert.deepEqual(
      h.drafts[0].buttons.map((b) => b.id),
      [`slot:${SLOT_A}`],
    );
  });

  it("sends no buttons with an answer that has nothing to offer", async () => {
    const h = harness({
      inboundText: "إمتى بتفتحوا؟",
      reply: {
        language: "ar",
        intent: "hours",
        confidence: 0.96,
        reply: "من الأحد للخميس، 10 الصبح لحد 6 المسا.",
      },
    });
    await runAutoReply(h.deps);
    assert.deepEqual(h.sent[0].buttons, []);
  });
});
