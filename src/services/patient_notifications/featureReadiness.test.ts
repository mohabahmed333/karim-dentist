import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { evaluateFeatures, stateOf } from "./featureReadiness.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { PATIENT_TEMPLATES } from "./templates.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildTemplateForKind } from "./templateParams.ts";

const ALL_APPROVED = ["appoinment_en", "appoinment_ar", "reminder_en", "reminder_ar"];

const ready = (over: Record<string, unknown> = {}) => ({
  env: { cronSecret: true, kapso: true, kapsoWebhookSecret: true, serviceRole: true, groqKey: true },
  notificationTablesPresent: true,
  notifications: { mode: "send", recallEnabled: true, reminderLeadMinutes: 1440 },
  cronScheduled: true,
  approvedTemplateNames: ALL_APPROVED,
  ai: { mode: "auto", allowBookingWrites: true },
  publishedKnowledge: 5,
  clinicMapUrl: true,
  ...over,
});

const feature = (facts: ReturnType<typeof ready>, key: string) =>
  evaluateFeatures(facts).find((f: { key: string }) => f.key === key)!;

const unmet = (facts: ReturnType<typeof ready>, key: string) =>
  feature(facts, key).conditions.filter((c: { met: boolean | null }) => c.met === false).map((c: { key: string }) => c.key);

describe("stateOf", () => {
  it("blocks on any unmet condition, asks for a check on anything unverifiable", () => {
    assert.equal(stateOf([{ met: true }, { met: true }]), "working");
    assert.equal(stateOf([{ met: true }, { met: null }]), "check");
    assert.equal(stateOf([{ met: null }, { met: false }]), "blocked");
  });
});

describe("evaluateFeatures", () => {
  it("reports confirmations and reminders working once everything is in place", () => {
    assert.equal(feature(ready(), "confirmations").state, "working");
    assert.equal(feature(ready(), "reminders").state, "working");
  });

  it("names the exact reason when the scheduler is missing", () => {
    assert.deepEqual(unmet(ready({ cronScheduled: false }), "confirmations"), ["scheduler"]);
  });

  it("never treats an unverifiable scheduler as satisfied", () => {
    assert.equal(feature(ready({ cronScheduled: null }), "confirmations").state, "check");
  });

  it("blocks sending while the switch is on Dry run", () => {
    const facts = ready({ notifications: { mode: "dry_run", recallEnabled: true, reminderLeadMinutes: 1440 } });
    assert.deepEqual(unmet(facts, "confirmations"), ["mode_send"]);
  });

  it("blocks reminders when the lead time would make “tomorrow” untrue", () => {
    const facts = ready({ notifications: { mode: "send", recallEnabled: true, reminderLeadMinutes: 720 } });
    assert.deepEqual(unmet(facts, "reminders"), ["lead_1440"]);
  });

  it("shows cancellation notices as blocked because no template exists yet", () => {
    assert.deepEqual(unmet(ready(), "cancellations"), ["template_cancellation"]);
  });

  it("reports unapproved core templates by name", () => {
    const f = feature(ready({ approvedTemplateNames: ["appoinment_en"] }), "confirmations");
    const t = f.conditions.find((c: { key: string }) => c.key === "template_confirmation")!;
    assert.equal(t.met, false);
    assert.match(t.why, /appoinment_ar/);
  });

  it("needs the assistant on Replies with booking allowed for cancel-by-reply", () => {
    const facts = ready({ ai: { mode: "draft_only", allowBookingWrites: false } });
    assert.deepEqual(unmet(facts, "cancel_by_reply").sort(), ["ai_auto", "booking_writes"]);
  });

  it("keeps recalls blocked while the marketing switch is off", () => {
    const facts = ready({ notifications: { mode: "send", recallEnabled: false, reminderLeadMinutes: 1440 } });
    assert.ok(unmet(facts, "recalls").includes("recall_switch"));
  });

  it("asks for a human check on marketing consent rather than assuming it", () => {
    const consent = feature(ready(), "recalls").conditions.find((c: { key: string }) => c.key === "consent")!;
    assert.equal(consent.met, null);
  });

  it("blocks knowledge answers when nothing is published", () => {
    assert.deepEqual(unmet(ready({ publishedKnowledge: 0 }), "knowledge"), ["knowledge_entries"]);
  });

  it("lets STOP work with the assistant switched off", () => {
    const facts = ready({ ai: { mode: "off", allowBookingWrites: false } });
    assert.equal(feature(facts, "stop").state, "working");
  });

  it("marks every assistant feature blocked when the assistant is off", () => {
    const facts = ready({ ai: { mode: "off", allowBookingWrites: false } });
    for (const key of ["voice_notes", "knowledge", "review_queue"]) {
      assert.ok(unmet(facts, key).includes("ai_on"), key);
    }
  });

  it("does not report knowledge or correction capture as working on an un-migrated database", () => {
    // Found running this against production: the assistant was on, so
    // "Learning from staff corrections" showed as working — while its table did
    // not exist and every capture was being silently dropped.
    const facts = ready({ notificationTablesPresent: false });
    assert.ok(unmet(facts, "review_queue").includes("migrations"));
    assert.ok(unmet(facts, "knowledge").includes("migrations"));
    // Voice notes and cancel-by-reply need no new tables.
    assert.ok(!unmet(facts, "voice_notes").includes("migrations"));
    assert.ok(!unmet(facts, "cancel_by_reply").includes("migrations"));
  });

  it("tells the user what to do for every condition, set up or not", () => {
    // The "?" in Settings shows this text. An empty one would be a tooltip with
    // nothing in it, on exactly the item someone is stuck on.
    for (const facts of [ready(), ready({
      env: { cronSecret: false, kapso: false, kapsoWebhookSecret: false, serviceRole: false, groqKey: false },
      notificationTablesPresent: false, notifications: null, cronScheduled: null,
      approvedTemplateNames: null, ai: null, publishedKnowledge: 0, clinicMapUrl: false,
    })]) {
      for (const f of evaluateFeatures(facts)) {
        for (const c of f.conditions) {
          assert.ok(c.fix && c.fix.trim().length > 10, `${f.key}/${c.key} has no fix text`);
        }
      }
    }
  });

  it("stays consistent with what the dispatcher can actually build", () => {
    // If a template is added to PATIENT_TEMPLATES without a builder, Settings
    // would say "ready" while the dispatcher records no_approved_template.
    const input = { patientName: "A", clinicName: "B", startsAt: "2026-09-20T09:00:00Z", serviceLabel: "C", language: "en" };
    for (const kind of new Set(PATIENT_TEMPLATES.map((t: { kind: string }) => t.kind))) {
      assert.notEqual(buildTemplateForKind(kind, input), null, `${kind} is listed but has no builder`);
    }
  });
});
