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
  env: {
    cronSecret: true,
    kapso: true,
    kapsoWebhookSecret: true,
    serviceRole: true,
    aiKey: true,
    visionKey: true,
  },
  notificationTablesPresent: true,
  notifications: { mode: "send", recallEnabled: true, reminderLeadMinutes: 1440 },
  cronScheduled: true,
  approvedTemplateNames: ALL_APPROVED,
  ai: { mode: "auto", allowBookingWrites: true },
  publishedKnowledge: 5,
  clinicMapUrl: true,
  marketingConsentCount: 12,
  reviewUrl: true,
  featureSwitches: {},
  depositTablesPresent: true,
  deposits: {
    enabled: true,
    autoConfirm: true,
    amountEgp: 200,
    hasDestination: true,
    recipientNames: 1,
  },
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

  it("checks marketing consent for real, now that it is recorded", () => {
    // It used to be a "confirm this yourself" note because nothing stored
    // consent. It is a table and a hard gate in the dispatcher now, so the
    // checklist has to answer the same question the dispatcher asks.
    for (const key of ["recalls", "reviews"]) {
      assert.deepEqual(unmet(ready({ marketingConsentCount: 0 }), key).includes("marketing_consent"), true, key);
      assert.equal(unmet(ready(), key).includes("marketing_consent"), false, key);
    }
  });

  it("says to check by hand only when consent could not be counted", () => {
    const condition = feature(ready({ marketingConsentCount: null }), "recalls").conditions.find(
      (c: { key: string }) => c.key === "marketing_consent",
    )!;
    assert.equal(condition.met, null);
  });

  it("blocks review requests with nowhere to send anyone", () => {
    // Alongside the two templates still waiting on Meta, which are their own
    // blockers and not what this asserts.
    assert.equal(unmet(ready({ reviewUrl: false }), "reviews").includes("review_url"), true);
    assert.equal(unmet(ready(), "reviews").includes("review_url"), false);
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
      env: { cronSecret: false, kapso: false, kapsoWebhookSecret: false, serviceRole: false, aiKey: false },
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

describe("evaluateFeatures — deposits", () => {
  it("works once configured, and needs the assistant able to book", () => {
    assert.equal(feature(ready(), "deposits").state, "working");
    assert.deepEqual(unmet(ready({ ai: { mode: "draft_only", allowBookingWrites: true } }), "deposits"), [
      "ai_auto",
    ]);
  });

  it("blocks with nothing to match a receipt's recipient against", () => {
    // The quiet failure this condition exists for: everything else is fine, so
    // the feature looks healthy while collecting nothing automatically.
    const facts = ready({
      deposits: { enabled: true, autoConfirm: true, amountEgp: 200, hasDestination: true, recipientNames: 0 },
    });
    assert.deepEqual(unmet(facts, "deposits"), ["deposit_recipient_names"]);
  });

  it("blocks when no model can read an image, even with an AI key set", () => {
    const facts = ready({
      env: { cronSecret: true, kapso: true, kapsoWebhookSecret: true, serviceRole: true, aiKey: true, visionKey: false },
    });
    assert.deepEqual(unmet(facts, "deposits"), ["vision_key"]);
  });

  it("blocks on an amount of zero and on having nowhere to send it", () => {
    const facts = ready({
      deposits: { enabled: true, autoConfirm: true, amountEgp: 0, hasDestination: false, recipientNames: 1 },
    });
    assert.deepEqual(unmet(facts, "deposits"), ["deposit_amount", "deposit_destination"]);
  });

  it("reports the tables missing on a database without the migrations", () => {
    const facts = ready({ depositTablesPresent: false, deposits: null });
    assert.ok(unmet(facts, "deposits").includes("deposit_migrations"));
  });

  it("separates automatic confirmation from the feature itself", () => {
    const facts = ready({
      deposits: { enabled: true, autoConfirm: false, amountEgp: 200, hasDestination: true, recipientNames: 1 },
    });
    // Collecting deposits still works; only confirming without staff does not.
    assert.equal(feature(facts, "deposits").state, "working");
    assert.deepEqual(unmet(facts, "deposits_auto"), ["deposit_auto_confirm"]);
  });

  it("always asks someone to confirm they watch the queue", () => {
    // Nothing can verify this, and a frozen hold waits forever without it.
    const conditions = feature(ready(), "deposits_auto").conditions;
    const manual = conditions.filter((c: { met: boolean | null }) => c.met === null);
    assert.deepEqual(manual.map((c: { key: string }) => c.key), ["watch_deposits_queue"]);
    assert.equal(feature(ready(), "deposits_auto").state, "check");
  });
});

describe("evaluateFeatures — the per-feature switch", () => {
  it("blocks a feature that is switched off, however ready it is", () => {
    const facts = ready({ featureSwitches: { confirmations: false } });
    assert.equal(feature(facts, "confirmations").state, "blocked");
    assert.ok(unmet(facts, "confirmations").includes("switch_confirmations"));
  });

  it("switches off exactly one feature, not its neighbours", () => {
    const facts = ready({ featureSwitches: { reminders: false } });
    assert.equal(feature(facts, "confirmations").state, "working");
    assert.equal(feature(facts, "reminders").state, "blocked");
  });

  it("treats an absent switch as on, so a missing row silences nothing", () => {
    assert.equal(feature(ready({ featureSwitches: {} }), "confirmations").state, "working");
  });

  it("gives every switchable feature a switch", () => {
    const facts = ready();
    for (const key of [
      "confirmations", "reminders", "cancellations", "reschedules", "waitlist",
      "followups", "recalls", "reviews", "cancel_by_reply", "voice_notes",
      "knowledge", "review_queue", "stop",
    ]) {
      const keys = feature(facts, key).conditions.map((c: { key: string }) => c.key);
      assert.ok(keys.includes(`switch_${key}`), `${key} has no switch`);
    }
  });
});

