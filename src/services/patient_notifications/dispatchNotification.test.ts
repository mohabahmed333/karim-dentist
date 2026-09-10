import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { dispatchNotification } from "./dispatchNotification.ts";

const NOW = new Date("2026-07-14T09:00:00Z");

const row = (over: Record<string, unknown> = {}) => ({
  id: "n1",
  kind: "confirmation",
  source: "staff",
  phone: "+201005551234",
  patient_name: "Ahmed",
  service_label: "Cleaning",
  starts_at: "2026-07-20T09:00:00Z",
  scheduled_for: NOW.toISOString(),
  conversation_id: null,
  attempts: 0,
  ...over,
});

function deps(over: Record<string, unknown> = {}) {
  const trace: string[] = [];
  const finished: Record<string, unknown>[] = [];
  const base = {
    trace,
    finished,
    now: () => NOW,
    settings: {
      mode: "send",
      timezone: "Africa/Cairo",
      quiet_hours_start: 22,
      quiet_hours_end: 9,
      max_per_patient_per_day: 3,
    },
    clinicName: "The Dental Lounge",
    hasTransport: true,
    async isOptedOut() {
      return false;
    },
    async countSentLast24h() {
      return 0;
    },
    async lastInboundBody() {
      return null;
    },
    async resolveConversation() {
      trace.push("resolveConversation");
      return "conv-1";
    },
    async markSendStarted() {
      trace.push("markSendStarted");
    },
    async send() {
      trace.push("send");
      return { id: "msg-1" };
    },
    async finish(_id: string, patch: Record<string, unknown>) {
      trace.push(`finish:${patch.status}`);
      finished.push(patch);
    },
  };
  return { ...base, ...over } as typeof base & Record<string, unknown>;
}

describe("dispatchNotification — the happy path", () => {
  it("sends and records what went out", async () => {
    const d = deps();
    const out = await dispatchNotification(d, row());

    assert.equal(out.status, "sent");
    assert.equal(out.messageId, "msg-1");
    const patch = d.finished[0];
    assert.equal(patch.status, "sent");
    assert.equal(patch.templateName, "appoinment_en");
    assert.equal(patch.conversationId, "conv-1");
    assert.equal(patch.outboundMessageId, "msg-1");
    // The rendered parameters are stored so staff can see the actual message.
    assert.deepEqual((patch.payload as { body: string[] }).body[0], "Ahmed");
  });

  it("marks the send as started BEFORE calling the provider", async () => {
    // This ordering is the entire duplicate-message guarantee. If the provider
    // call came first, a crash between send and finish would leave the row
    // retryable and the patient would get the message twice.
    const d = deps();
    await dispatchNotification(d, row());
    assert.deepEqual(d.trace, [
      "resolveConversation",
      "markSendStarted",
      "send",
      "finish:sent",
    ]);
  });

  it("reuses a conversation the row already knows about", async () => {
    const d = deps();
    await dispatchNotification(d, row({ conversation_id: "existing" }));
    assert.equal(d.trace.includes("resolveConversation"), false);
  });

  it("records a failed provider call without retrying it here", async () => {
    const d = deps({
      async send() {
        throw new Error("Kapso timeout");
      },
    });
    const out = await dispatchNotification(d, row());
    assert.equal(out.status, "failed");
    assert.equal(d.finished[0].status, "failed");
    assert.match(String(d.finished[0].lastError), /Kapso timeout/);
    // markSendStarted already ran, so the sweeper will abandon rather than
    // retry — a timeout is ambiguous and Meta may already have the message.
    assert.equal(d.trace.includes("markSendStarted"), true);
  });
});

describe("dispatchNotification — refusing to send", () => {
  it("skips an opted-out patient without building or resolving anything", async () => {
    const d = deps({
      async isOptedOut() {
        return true;
      },
    });
    const out = await dispatchNotification(d, row());
    assert.equal(out.reason, "opted_out");
    assert.deepEqual(d.trace, ["finish:skipped"]);
  });

  it("stays quiet for a kind this clinic has no approved template for", async () => {
    // Only confirmation and reminder_24h are approved. A cancellation has
    // nothing to send it with, and Meta forbids free text outside 24h.
    const d = deps();
    const out = await dispatchNotification(d, row({ kind: "cancellation" }));
    assert.equal(out.reason, "no_approved_template");
    assert.equal(d.trace.includes("send"), false);
  });

  it("defers instead of failing, and hands back a new due time", async () => {
    const night = new Date("2026-07-14T20:00:00Z"); // 23:00 Cairo
    const d = deps({ now: () => night });
    const out = await dispatchNotification(d, row({ scheduled_for: night.toISOString() }));

    assert.equal(out.status, "deferred");
    assert.equal(out.reason, "quiet_hours");
    // Back to pending, not skipped: a reminder held overnight is still useful.
    assert.equal(d.finished[0].status, "pending");
    assert.equal(
      Date.parse(String(d.finished[0].scheduledFor)) > night.getTime(),
      true,
    );
    assert.equal(d.trace.includes("send"), false);
  });
});

describe("dispatchNotification — dry run", () => {
  it("records the real message but sends nothing and creates no conversation", async () => {
    const d = deps({
      settings: { ...deps().settings, mode: "dry_run" },
    });
    const out = await dispatchNotification(d, row());

    assert.equal(out.reason, "dry_run");
    const patch = d.finished[0];
    assert.equal(patch.status, "skipped");
    // The point of a dry run is that staff can read exactly what would have
    // gone out, so the template and rendered parameters must be resolved.
    assert.equal(patch.templateName, "appoinment_en");
    assert.equal((patch.payload as { body: string[] }).body.length, 4);
    assert.deepEqual(d.trace, ["finish:skipped"]);
    // Creating a conversation for a patient we are deliberately not messaging
    // would leave real rows behind from a rehearsal.
    assert.equal(d.trace.includes("resolveConversation"), false);
  });
});

describe("dispatchNotification — language", () => {
  it("follows what the patient last wrote, not their name", async () => {
    const d = deps({
      async lastInboundBody() {
        return "عايز أحجز";
      },
    });
    await dispatchNotification(d, row());
    assert.equal(d.finished[0].templateName, "appoinment_ar");
  });
});
