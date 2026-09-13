import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { evaluateReadiness, requiredTemplateNames } from "./readiness.ts";

const ALL_TEMPLATES = ["appoinment_ar", "appoinment_en", "reminder_ar", "reminder_en"];

const facts = (over: Record<string, unknown> = {}) => ({
  hasCronSecret: true,
  hasKapso: true,
  hasServiceRole: true,
  approvedTemplateNames: ALL_TEMPLATES,
  cronScheduled: true,
  settingsRowPresent: true,
  ...over,
});

const statusOf = (r: ReturnType<typeof evaluateReadiness>, key: string) =>
  r.checks.find((c: { key: string }) => c.key === key)?.status;

describe("requiredTemplateNames", () => {
  it("lists exactly the names registered in Meta, misspellings and all", () => {
    assert.deepEqual(requiredTemplateNames(), ALL_TEMPLATES);
  });
});

describe("evaluateReadiness", () => {
  it("clears the flag for sending when everything is in place", () => {
    const out = evaluateReadiness(facts());
    assert.equal(out.canSend, true);
    assert.deepEqual(out.blocking, []);
  });

  it("blocks on a missing CRON_SECRET, the quietest failure of all", () => {
    // Without it the endpoint answers 503 and nothing is ever sent, with no
    // error anywhere a receptionist would see.
    const out = evaluateReadiness(facts({ hasCronSecret: false }));
    assert.equal(out.canSend, false);
    assert.deepEqual(out.blocking, ["cron_secret"]);
  });

  it("blocks on missing WhatsApp credentials", () => {
    const out = evaluateReadiness(facts({ hasKapso: false }));
    assert.deepEqual(out.blocking, ["whatsapp_transport"]);
  });

  it("names the templates that are not approved yet", () => {
    const out = evaluateReadiness(
      facts({ approvedTemplateNames: ["appoinment_en", "reminder_ar"] }),
    );
    // Still named, but no longer a reason to keep the whole system off: each
    // feature carries its own template condition and refuses on its own behalf.
    assert.equal(out.canSend, true);
    assert.equal(out.blocking.includes("templates"), false);
    const detail = out.checks.find((c: { key: string }) => c.key === "templates")?.detail ?? "";
    // Named explicitly: they are immutable in Meta and two are misspelled on
    // purpose, so "some templates are missing" would not be actionable.
    assert.match(detail, /appoinment_ar/);
    assert.match(detail, /reminder_en/);
    assert.doesNotMatch(detail, /appoinment_en/);
  });

  it("says so when it could not check, without holding the system hostage", () => {
    // It used to block. Refusing to let a clinic switch on because a check was
    // unavailable is a worse failure than letting them try: an unconfirmed
    // template cannot send a wrong message, only no message, and the queue says
    // which. The feature's own row still reports it.
    const out = evaluateReadiness(facts({ approvedTemplateNames: null }));
    assert.equal(statusOf(out, "templates"), "unknown");
    assert.equal(out.canSend, true);
    assert.deepEqual(out.blocking, []);
  });

  it("still refuses when the pipeline itself is missing, not merely unproven", () => {
    // The distinction that makes the above safe: "missing" is a fact, and
    // without these nothing sends at all, whatever any feature wants.
    for (const key of ["cron_secret", "whatsapp_transport", "service_role"]) {
      const broken = evaluateReadiness(
        facts({
          hasCronSecret: key !== "cron_secret",
          hasKapso: key !== "whatsapp_transport",
          hasServiceRole: key !== "service_role",
        }),
      );
      assert.equal(broken.canSend, false, key);
      assert.ok(broken.blocking.includes(key), key);
    }
  });

  it("blocks when nothing is scheduled to drain the queue", () => {
    const out = evaluateReadiness(facts({ cronScheduled: false }));
    assert.equal(out.canSend, false);
    assert.match(
      out.checks.find((c: { key: string }) => c.key === "scheduler")?.detail ?? "",
      /schedule_notifications_dispatch\.sql/,
    );
  });

  it("reports an unreadable cron.job as unknown rather than as absent", () => {
    assert.equal(statusOf(evaluateReadiness(facts({ cronScheduled: null })), "scheduler"), "unknown");
  });

  it("does not block on the settings row, which has a safe fallback", () => {
    const out = evaluateReadiness(facts({ settingsRowPresent: false }));
    assert.equal(statusOf(out, "settings_row"), "missing");
    // Absent settings read as 'off', so this is worth showing but not blocking.
    assert.equal(out.canSend, true);
  });

  it("reports every blocker at once, not just the first", () => {
    const out = evaluateReadiness(
      facts({ hasCronSecret: false, hasKapso: false, cronScheduled: false }),
    );
    assert.deepEqual(out.blocking, ["cron_secret", "whatsapp_transport", "scheduler"]);
  });
});
