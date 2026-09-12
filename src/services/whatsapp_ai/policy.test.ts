import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { evaluateAutoReplyPolicy } from "./policy.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { DEFAULT_AI_SETTINGS } from "./types.ts";

const NOW = new Date("2026-09-10T12:00:00.000Z");
const minutesAgo = (n: number) =>
  new Date(NOW.getTime() - n * 60_000).toISOString();

function input(overrides: Record<string, unknown> = {}) {
  return {
    settings: { ...DEFAULT_AI_SETTINGS, mode: "auto" },
    state: null,
    conversation: { status: "active", last_inbound_at: minutesAgo(2) },
    inbound: { message_type: "text", body: "what time do you open?" },
    counts: { conversationLastHour: 0, globalLastHour: 0 },
    lastHumanOutboundAt: null,
    hasAiKey: true,
    now: NOW,
    ...overrides,
  };
}

describe("evaluateAutoReplyPolicy — absolute stops", () => {
  it("allows a normal inbound message in auto mode", () => {
    assert.deepEqual(evaluateAutoReplyPolicy(input()), { allow: "auto" });
  });

  it("stays silent with no API key, before any model call", () => {
    const out = evaluateAutoReplyPolicy(input({ hasAiKey: false }));
    assert.deepEqual(out, { allow: "none", reason: "no_ai_key" });
  });

  it("stays silent when the feature is off", () => {
    const out = evaluateAutoReplyPolicy(
      input({ settings: { ...DEFAULT_AI_SETTINGS, mode: "off" } }),
    );
    assert.deepEqual(out, { allow: "none", reason: "mode_off" });
  });

  it("stays silent on an ended or archived conversation", () => {
    for (const status of ["ended", "archived"]) {
      const out = evaluateAutoReplyPolicy(
        input({ conversation: { status, last_inbound_at: minutesAgo(2) } }),
      );
      assert.equal(out.allow, "none", status);
      assert.equal(out.reason, "conversation_closed");
    }
  });

  it("honours the per-conversation kill switch", () => {
    const out = evaluateAutoReplyPolicy(
      input({ state: { autoreply_enabled: false } }),
    );
    assert.deepEqual(out, { allow: "none", reason: "conversation_disabled" });
  });

  it("honours a pause that has not expired, and ignores one that has", () => {
    const paused = evaluateAutoReplyPolicy(
      input({
        state: { autoreply_enabled: true, paused_until: minutesAgo(-30) },
      }),
    );
    assert.deepEqual(paused, { allow: "none", reason: "paused" });

    const expired = evaluateAutoReplyPolicy(
      input({
        state: { autoreply_enabled: true, paused_until: minutesAgo(30) },
      }),
    );
    assert.equal(expired.allow, "auto");
  });
});

describe("evaluateAutoReplyPolicy — unreadable messages", () => {
  /** The model must never guess at content it cannot read. */
  it("stays silent on media by default", () => {
    for (const type of ["image", "audio", "video", "document", "location", "contacts"]) {
      const out = evaluateAutoReplyPolicy(
        input({ inbound: { message_type: type, body: "" } }),
      );
      assert.equal(out.allow, "none", type);
      assert.equal(out.reason, "unreadable_message");
    }
  });

  it("drafts an acknowledgement for media when that is enabled", () => {
    const out = evaluateAutoReplyPolicy(
      input({
        settings: { ...DEFAULT_AI_SETTINGS, mode: "auto", ack_media_enabled: true },
        inbound: { message_type: "image", body: "" },
      }),
    );
    assert.deepEqual(out, { allow: "draft", reason: "unreadable_message" });
  });

  it("treats interactive button replies as readable text", () => {
    const out = evaluateAutoReplyPolicy(
      input({ inbound: { message_type: "interactive", body: "Book a cleaning" } }),
    );
    assert.equal(out.allow, "auto");
  });

  it("ignores an empty text message", () => {
    const out = evaluateAutoReplyPolicy(
      input({ inbound: { message_type: "text", body: "   " } }),
    );
    assert.deepEqual(out, { allow: "none", reason: "empty_message" });
  });
});

describe("evaluateAutoReplyPolicy — humans and windows", () => {
  it("drafts rather than talking over a human who just replied", () => {
    const out = evaluateAutoReplyPolicy(
      input({ lastHumanOutboundAt: minutesAgo(5) }),
    );
    assert.deepEqual(out, { allow: "draft", reason: "human_active" });
  });

  it("resumes once the handoff window has passed", () => {
    const out = evaluateAutoReplyPolicy(
      input({ lastHumanOutboundAt: minutesAgo(45) }),
    );
    assert.equal(out.allow, "auto");
  });

  it("respects an explicit handoff_until even with no recent human message", () => {
    const out = evaluateAutoReplyPolicy(
      input({
        state: { autoreply_enabled: true, handoff_until: minutesAgo(-10) },
      }),
    );
    assert.deepEqual(out, { allow: "draft", reason: "human_active" });
  });

  /**
   * Free text outside Meta's 24h customer-care window is a policy violation.
   * Draft it so staff can pick an approved template.
   */
  it("drafts when the 24h window has closed", () => {
    const out = evaluateAutoReplyPolicy(
      input({
        conversation: { status: "active", last_inbound_at: minutesAgo(25 * 60) },
      }),
    );
    assert.deepEqual(out, { allow: "draft", reason: "session_closed" });
  });
});

describe("evaluateAutoReplyPolicy — rate limits", () => {
  // The cap only applies when the assistant is not carrying the whole thread;
  // see fullConversation.test.ts for the other half of this rule.
  it("drafts once a conversation hits its hourly cap", () => {
    const out = evaluateAutoReplyPolicy(
      input({
        settings: { ...DEFAULT_AI_SETTINGS, mode: "auto", full_conversation: false },
        counts: { conversationLastHour: 6, globalLastHour: 0 },
      }),
    );
    assert.deepEqual(out, { allow: "draft", reason: "rate_limited_conversation" });
  });

  /** Global overload should be quiet, not a flood of drafts in every thread. */
  it("goes silent — not draft — at the global cap", () => {
    const out = evaluateAutoReplyPolicy(
      input({ counts: { conversationLastHour: 0, globalLastHour: 120 } }),
    );
    assert.deepEqual(out, { allow: "none", reason: "rate_limited_global" });
  });

  it("treats a zero cap as 'never auto-send'", () => {
    const out = evaluateAutoReplyPolicy(
      input({
        settings: {
          ...DEFAULT_AI_SETTINGS,
          mode: "auto",
          full_conversation: false,
          max_replies_per_conversation_per_hour: 0,
        },
      }),
    );
    assert.equal(out.allow, "draft");
  });
});

describe("evaluateAutoReplyPolicy — modes", () => {
  it("drafts everything in draft_only mode", () => {
    const out = evaluateAutoReplyPolicy(
      input({ settings: { ...DEFAULT_AI_SETTINGS, mode: "draft_only" } }),
    );
    assert.deepEqual(out, { allow: "draft", reason: "mode_draft_only" });
  });

  it("puts an absolute stop ahead of draft_only", () => {
    const out = evaluateAutoReplyPolicy(
      input({
        settings: { ...DEFAULT_AI_SETTINGS, mode: "draft_only" },
        conversation: { status: "archived", last_inbound_at: minutesAgo(2) },
      }),
    );
    assert.equal(out.allow, "none");
  });

  it("ships off by default", () => {
    assert.equal(DEFAULT_AI_SETTINGS.mode, "off");
    assert.equal(DEFAULT_AI_SETTINGS.allow_booking_writes, false);
  });
});

/**
 * Voice notes.
 *
 * Egyptian patients send them constantly, and until now every one was dropped
 * before any model call — the patient simply got no reply. Kapso already
 * transcribes them, so a transcribed voice note is exactly as readable as text.
 */
describe("evaluateAutoReplyPolicy — transcribed voice notes", () => {
  const voice = (body: string, type = "audio") =>
    evaluateAutoReplyPolicy(input({ inbound: { message_type: type, body } }));

  it("answers a voice note once its transcript has arrived", () => {
    assert.deepEqual(voice("عايز أحجز ميعاد بكرة"), { allow: "auto" });
    assert.deepEqual(voice("can I move my appointment?", "voice"), {
      allow: "auto",
    });
  });

  it("stays silent while transcription is still pending", () => {
    // kapso.processing_status is 'pending' on arrival, so an empty body here is
    // routine rather than an error.
    assert.deepEqual(voice(""), { allow: "none", reason: "unreadable_message" });
  });

  it("refuses to answer Whisper's non-speech markers", () => {
    // Production already contains "[outro jingle]". Treating that as a message
    // would have the assistant confidently answer something nobody said.
    for (const marker of ["[outro jingle]", "[music]", "(silence)"]) {
      assert.deepEqual(
        voice(marker),
        { allow: "none", reason: "unreadable_message" },
        `${marker} must not be treated as speech`,
      );
    }
  });

  it("still drafts an acknowledgement for unreadable audio when that is enabled", () => {
    const out = evaluateAutoReplyPolicy(
      input({
        settings: { ...DEFAULT_AI_SETTINGS, mode: "auto", ack_media_enabled: true },
        inbound: { message_type: "audio", body: "" },
      }),
    );
    assert.deepEqual(out, { allow: "draft", reason: "unreadable_message" });
  });

  it("leaves other media untouched", () => {
    assert.deepEqual(
      evaluateAutoReplyPolicy(
        input({ inbound: { message_type: "image", body: "a photo of a tooth" } }),
      ),
      { allow: "none", reason: "unreadable_message" },
    );
  });
});
