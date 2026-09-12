import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { decideAutoReply } from "./decideAutoReply.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { evaluateAutoReplyPolicy } from "./policy.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { DEFAULT_AI_SETTINGS } from "./types.ts";

const SLOT = "11111111-1111-4111-8111-111111111111";

function envelope(over: Record<string, unknown> = {}) {
  return {
    language: "en",
    intent: "other",
    confidence: 0.9,
    handoff: false,
    handoffReason: "",
    reply: "ok",
    ack: "",
    actions: [],
    offeredSlotIds: [],
    needs: [],
    collected: {},
    ...over,
  };
}

function decide(over: Record<string, unknown> = {}, envOver: Record<string, unknown> = {}) {
  return decideAutoReply({
    envelope: envelope(envOver),
    injectionFlags: [],
    offeredSlotIds: [SLOT],
    ownReservationIds: [],
    allowBookingWrites: true,
    fullConversation: true,
    ...over,
  });
}

describe("carrying the whole conversation — what it now answers itself", () => {
  for (const [intent, confidence] of [
    ["other", 0.2],
    ["complaint", 0.95],
    ["feedback_negative", 0.95],
    ["pricing", 0.1],
    ["booking_request", 0.3],
    ["hours", 0.05],
  ] as const) {
    it(`answers ${intent} at confidence ${confidence}`, () => {
      assert.equal(decide({}, { intent, confidence }).action, "auto_send");
    });
  }

  /** The model wanting out is no longer a reason to leave the patient waiting. */
  it("answers anyway when the model asked to hand over", () => {
    const decision = decide({}, { handoff: true, handoffReason: "no_knowledge" });
    assert.equal(decision.action, "auto_send");
  });
});

describe("carrying the whole conversation — what it still will not answer", () => {
  /**
   * Not a setting the clinic can switch off. A wrong answer about someone's
   * body is the one mistake that cannot be taken back.
   */
  for (const intent of ["clinical_question", "emergency"] as const) {
    it(`still hands ${intent} to a person, at any confidence`, () => {
      assert.equal(decide({}, { intent, confidence: 1 }).action, "draft");
      assert.equal(decide({}, { intent, confidence: 0.1 }).action, "draft");
    });
  }

  it("still refuses a message addressed to the model, not the clinic", () => {
    const decision = decide({ injectionFlags: ["ignore_instructions"] });
    assert.equal(decision.action, "draft");
    assert.equal(decision.reason, "injection");
  });

  it("still refuses a slot the server never offered", () => {
    const decision = decide(
      {},
      {
        intent: "booking_request",
        actions: [{ kind: "booking.book_slot", slotId: "99999999-9999-4999-8999-999999999999" }],
      },
    );
    assert.equal(decision.reason, "slot_not_offered");
  });

  it("still refuses to write when booking is switched off", () => {
    const decision = decide(
      { allowBookingWrites: false },
      { intent: "booking_request", actions: [{ kind: "booking.book_slot", slotId: SLOT }] },
    );
    assert.equal(decision.reason, "booking_writes_disabled");
  });
});

describe("carrying the whole conversation — the hourly cap", () => {
  const base = {
    state: null,
    conversation: { status: "active", last_inbound_at: new Date().toISOString() },
    inbound: { message_type: "text", body: "hi" },
    lastHumanOutboundAt: null,
    hasAiKey: true,
  };

  /** A booking done by tapping runs to a dozen short turns. */
  it("keeps answering past the per-conversation cap", () => {
    const decision = evaluateAutoReplyPolicy({
      ...base,
      settings: { ...DEFAULT_AI_SETTINGS, mode: "auto", full_conversation: true },
      counts: { conversationLastHour: 99, globalLastHour: 0 },
    });
    assert.deepEqual(decision, { allow: "auto" });
  });

  it("still stops at the cap when it is not carrying the thread", () => {
    const decision = evaluateAutoReplyPolicy({
      ...base,
      settings: { ...DEFAULT_AI_SETTINGS, mode: "auto", full_conversation: false },
      counts: { conversationLastHour: 99, globalLastHour: 0 },
    });
    assert.deepEqual(decision, { allow: "draft", reason: "rate_limited_conversation" });
  });

  /** The global cap guards the bill, and is not part of this bargain. */
  it("still goes quiet when the whole system is overloaded", () => {
    const decision = evaluateAutoReplyPolicy({
      ...base,
      settings: { ...DEFAULT_AI_SETTINGS, mode: "auto", full_conversation: true },
      counts: { conversationLastHour: 0, globalLastHour: 9999 },
    });
    assert.deepEqual(decision, { allow: "none", reason: "rate_limited_global" });
  });

  it("still steps back while a colleague is answering", () => {
    const decision = evaluateAutoReplyPolicy({
      ...base,
      settings: { ...DEFAULT_AI_SETTINGS, mode: "auto", full_conversation: true },
      counts: { conversationLastHour: 0, globalLastHour: 0 },
      lastHumanOutboundAt: new Date().toISOString(),
    });
    assert.deepEqual(decision, { allow: "draft", reason: "human_active" });
  });
});
