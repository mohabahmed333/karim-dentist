/**
 * What is still missing before patients can actually be messaged.
 *
 * Every check here corresponds to a real way this system goes quiet without
 * erroring: a missing CRON_SECRET makes the endpoint answer 503, absent Kapso
 * credentials make every row defer, an unscheduled cron job means the queue
 * never drains at all. None of those surface anywhere a receptionist would
 * look, which is the point of this module.
 *
 * The evaluation is pure. Gathering the facts is the caller's job, so that the
 * rules can be tested without a database, a WhatsApp account or a live cron.
 */

import { PATIENT_TEMPLATES } from "./templates";

export type CheckStatus = "ok" | "missing" | "unknown";

export type ReadinessCheck = {
  key: string;
  status: CheckStatus;
  /** Whether `mode = 'send'` is unsafe without it. */
  required: boolean;
  detail: string;
};

export type ReadinessFacts = {
  hasCronSecret: boolean;
  hasKapso: boolean;
  hasServiceRole: boolean;
  /** Approved template names from Meta, or null when we could not ask. */
  approvedTemplateNames: string[] | null;
  /** Whether pg_cron has the dispatch job, or null when we could not ask. */
  cronScheduled: boolean | null;
  settingsRowPresent: boolean;
};

export type Readiness = {
  checks: ReadinessCheck[];
  /** Safe to switch the flag to `send`. */
  canSend: boolean;
  /** Keys of the required checks that are not `ok`. */
  blocking: string[];
};

/** The template names this clinic must have approved before anything can send. */
export function requiredTemplateNames(): string[] {
  return [...new Set(PATIENT_TEMPLATES.map((t) => t.name))].sort();
}

function templateCheck(approved: string[] | null): ReadinessCheck {
  const required = requiredTemplateNames();
  if (approved === null) {
    return {
      key: "templates",
      status: "unknown",
      required: true,
      detail:
        "Could not ask Meta which templates are approved — set KAPSO_BUSINESS_ACCOUNT_ID.",
    };
  }
  const missing = required.filter((name) => !approved.includes(name));
  if (missing.length === 0) {
    return {
      key: "templates",
      status: "ok",
      required: true,
      detail: `All ${required.length} templates approved.`,
    };
  }
  return {
    key: "templates",
    status: "missing",
    required: true,
    // Named explicitly: these are immutable in Meta and easy to mistype, and
    // two of them are deliberately misspelled.
    detail: `Not approved yet: ${missing.join(", ")}.`,
  };
}

export function evaluateReadiness(facts: ReadinessFacts): Readiness {
  const checks: ReadinessCheck[] = [
    {
      key: "cron_secret",
      status: facts.hasCronSecret ? "ok" : "missing",
      required: true,
      detail: facts.hasCronSecret
        ? "Set."
        : "CRON_SECRET is unset, so /api/v1/notifications/dispatch answers 503 and nothing is ever sent.",
    },
    {
      key: "whatsapp_transport",
      status: facts.hasKapso ? "ok" : "missing",
      required: true,
      detail: facts.hasKapso
        ? "Kapso credentials present."
        : "KAPSO_API_KEY or KAPSO_PHONE_NUMBER_ID is unset — every notification defers with no_transport.",
    },
    {
      key: "service_role",
      status: facts.hasServiceRole ? "ok" : "missing",
      required: true,
      detail: facts.hasServiceRole
        ? "Set."
        : "SUPABASE_SERVICE_ROLE_KEY is unset — the dispatcher cannot read the queue.",
    },
    templateCheck(facts.approvedTemplateNames),
    {
      key: "scheduler",
      status:
        facts.cronScheduled === null
          ? "unknown"
          : facts.cronScheduled
            ? "ok"
            : "missing",
      required: true,
      detail:
        facts.cronScheduled === null
          ? "Could not read cron.job — pg_cron may not be enabled on this database."
          : facts.cronScheduled
            ? "pg_cron calls the dispatcher every minute."
            : "No pg_cron job. Run supabase/scripts/schedule_notifications_dispatch.sql — until then the queue only drains when something calls the endpoint by hand.",
    },
    {
      key: "settings_row",
      status: facts.settingsRowPresent ? "ok" : "missing",
      required: false,
      detail: facts.settingsRowPresent
        ? "Present."
        : "No settings row — the dispatcher falls back to 'off'.",
    },
  ];

  // `unknown` blocks too. Turning on sends when we cannot confirm the templates
  // exist is exactly the case where every message fails at the provider.
  const blocking = checks
    .filter((c) => c.required && c.status !== "ok")
    .map((c) => c.key);

  return { checks, canSend: blocking.length === 0, blocking };
}
