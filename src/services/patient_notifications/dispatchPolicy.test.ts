import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { evaluateDispatchPolicy } from "./dispatchPolicy.ts";

// Midday Cairo in summer, comfortably outside quiet hours.
const NOW = new Date("2026-07-14T09:00:00Z");

const settings = (over: Record<string, unknown> = {}) => ({
  mode: "send",
  timezone: "Africa/Cairo",
  quiet_hours_start: 22,
  quiet_hours_end: 9,
  max_per_patient_per_day: 3,
  ...over,
});

const row = (over: Record<string, unknown> = {}) => ({
  kind: "confirmation",
  source: "staff",
  starts_at: "2026-07-20T09:00:00Z",
  scheduled_for: NOW.toISOString(),
  ...over,
});

const decide = (over: Record<string, unknown> = {}) =>
  evaluateDispatchPolicy({
    now: NOW,
    settings: settings(),
    row: row(),
    optedOut: false,
    hasTransport: true,
    sentLast24h: 0,
    ...over,
  });

describe("evaluateDispatchPolicy — the absolute stops", () => {
  it("sends when nothing is in the way", () => {
    assert.equal(decide().action, "send");
  });

  it("skips rather than holds when the system is off", () => {
    // Held rows would all fire the moment someone flips the switch, blasting a
    // backlog of stale messages at every patient at once.
    const out = decide({ settings: settings({ mode: "off" }) });
    assert.deepEqual(out, { action: "skip", reason: "mode_off" });
  });

  it("holds, not drops, when WhatsApp credentials are missing", () => {
    const out = decide({ hasTransport: false });
    assert.equal(out.action, "defer");
    assert.equal(out.reason, "no_transport");
  });

  it("honours an opt-out for transactional messages too", () => {
    // A patient who said stop meant stop. The clinic can still phone them.
    assert.deepEqual(decide({ optedOut: true }), {
      action: "skip",
      reason: "opted_out",
    });
  });

  it("stays quiet when the bot already told the patient itself", () => {
    const out = decide({ row: row({ kind: "cancellation", source: "whatsapp_bot" }) });
    assert.deepEqual(out, { action: "skip", reason: "bot_already_told_patient" });
  });

  it("still sends a staff cancellation", () => {
    assert.equal(decide({ row: row({ kind: "cancellation", source: "staff" }) }).action, "send");
  });
});

describe("evaluateDispatchPolicy — staleness", () => {
  it("says nothing about an appointment that has already passed", () => {
    const out = decide({ row: row({ starts_at: "2026-07-13T09:00:00Z" }) });
    assert.deepEqual(out, { action: "skip", reason: "appointment_passed" });
  });

  it("drops work that has been due for hours — a broken queue, not a busy one", () => {
    const out = decide({
      row: row({ scheduled_for: new Date(NOW.getTime() - 7 * 3_600_000).toISOString() }),
    });
    assert.deepEqual(out, { action: "skip", reason: "stale" });
  });

  it("does not treat a reminder queued days ahead as stale", () => {
    // Reminders are enqueued at booking time and due much later, so staleness
    // has to be measured from scheduled_for rather than created_at.
    const out = decide({
      row: row({
        kind: "reminder_24h",
        starts_at: "2026-07-15T09:00:00Z",
        scheduled_for: NOW.toISOString(),
      }),
    });
    assert.equal(out.action, "send");
  });
});

describe("evaluateDispatchPolicy — the reminder must not lie", () => {
  const reminder = (startsAt: string) =>
    decide({ row: row({ kind: "reminder_24h", starts_at: startsAt }) });

  it("sends when the appointment really is tomorrow", () => {
    assert.equal(reminder("2026-07-15T09:00:00Z").action, "send");
  });

  it("skips when the send has slipped and the appointment is today", () => {
    // The approved template hardcodes "tomorrow". After a quiet-hours deferral
    // past midnight it would name the wrong day with total confidence.
    const out = reminder("2026-07-14T20:00:00Z");
    assert.deepEqual(out, { action: "skip", reason: "no_longer_tomorrow" });
  });

  it("skips when the appointment is further out than tomorrow", () => {
    assert.deepEqual(reminder("2026-07-18T09:00:00Z"), {
      action: "skip",
      reason: "no_longer_tomorrow",
    });
  });
});

describe("evaluateDispatchPolicy — holding back", () => {
  it("holds a late-night send until the morning", () => {
    // 23:00 Cairo, summer.
    const night = new Date("2026-07-14T20:00:00Z");
    const out = evaluateDispatchPolicy({
      now: night,
      settings: settings(),
      row: row({ scheduled_for: night.toISOString() }),
      optedOut: false,
      hasTransport: true,
      sentLast24h: 0,
    });
    assert.equal(out.action, "defer");
    assert.equal(out.reason, "quiet_hours");
    assert.equal(out.action === "defer" && out.until.getTime() > night.getTime(), true);
  });

  it("spreads a burst instead of dropping the third message", () => {
    const out = decide({ sentLast24h: 3 });
    assert.equal(out.action, "defer");
    assert.equal(out.reason, "daily_cap");
  });

  it("checks quiet hours before the cap, so a night-time burst waits for morning", () => {
    const night = new Date("2026-07-14T20:00:00Z");
    const out = evaluateDispatchPolicy({
      now: night,
      settings: settings(),
      row: row({ scheduled_for: night.toISOString() }),
      optedOut: false,
      hasTransport: true,
      sentLast24h: 99,
    });
    assert.equal(out.reason, "quiet_hours");
  });

  it("evaluates dry_run last, so the log shows the decision a real send would reach", () => {
    assert.deepEqual(decide({ settings: settings({ mode: "dry_run" }) }), {
      action: "skip",
      reason: "dry_run",
    });
    // A dry run inside quiet hours still reports quiet_hours, not dry_run.
    const night = new Date("2026-07-14T20:00:00Z");
    const out = evaluateDispatchPolicy({
      now: night,
      settings: settings({ mode: "dry_run" }),
      row: row({ scheduled_for: night.toISOString() }),
      optedOut: false,
      hasTransport: true,
      sentLast24h: 0,
    });
    assert.equal(out.reason, "quiet_hours");
  });
});
