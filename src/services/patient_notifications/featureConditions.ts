/**
 * The individual conditions a feature depends on.
 *
 * Each condition is a real, named reason a feature can silently fail to work.
 * `met` is three-valued on purpose: `null` means "cannot be checked
 * automatically" — patient consent, or a fact only a person can confirm — and
 * must never be shown as satisfied.
 */

import { PATIENT_TEMPLATES } from "./templates";

export type Condition = {
  key: string;
  label: string;
  met: boolean | null;
  /** What goes wrong without it, and how to fix it. */
  why: string;
};

export type AiMode = "off" | "draft_only" | "auto";

export type FeatureFacts = {
  env: {
    cronSecret: boolean;
    kapso: boolean;
    kapsoWebhookSecret: boolean;
    serviceRole: boolean;
    groqKey: boolean;
  };
  /** False when the production database has not had the migrations applied. */
  notificationTablesPresent: boolean;
  notifications: {
    mode: string;
    recallEnabled: boolean;
    reminderLeadMinutes: number;
  } | null;
  cronScheduled: boolean | null;
  /** Approved template names from Meta, or null when Meta could not be asked. */
  approvedTemplateNames: string[] | null;
  ai: { mode: AiMode; allowBookingWrites: boolean } | null;
  publishedKnowledge: number | null;
  clinicMapUrl: boolean;
};

const c = (key: string, label: string, met: boolean | null, why: string): Condition => ({
  key,
  label,
  met,
  why,
});

/** Everything any outbound message needs, before its own template. */
export function sendPipeline(f: FeatureFacts): Condition[] {
  return [
    c("migrations", "Database updated with the notification tables", f.notificationTablesPresent,
      "Without them nothing is queued at all. Run supabase db push --linked."),
    c("mode_send", "Patient notifications switched to Send", f.notifications?.mode === "send",
      "Off queues nothing that will ever send; Dry run renders messages but sends none."),
    c("cron_secret", "CRON_SECRET set on the server", f.env.cronSecret,
      "The dispatch endpoint refuses every call without it. Set it in Vercel and redeploy."),
    c("scheduler", "Scheduler calls the dispatcher every minute", f.cronScheduled,
      "Messages wait in the queue forever. Run supabase/scripts/schedule_notifications_dispatch.sql."),
    c("whatsapp", "WhatsApp (Kapso) credentials set", f.env.kapso,
      "Every message is postponed with no_transport."),
    c("service_role", "Supabase service role key set", f.env.serviceRole,
      "The dispatcher cannot read the queue."),
  ];
}

/**
 * Whether this message type has a template the app can send.
 *
 * A kind absent from PATIENT_TEMPLATES has no template name at all, so Meta
 * cannot even be asked about it — the honest answer is "not set up", not
 * "unknown".
 */
export function templateCondition(kind: string, f: FeatureFacts): Condition {
  const names = PATIENT_TEMPLATES.filter((t) => t.kind === kind).map((t) => t.name);
  if (names.length === 0) {
    return c(`template_${kind}`, "WhatsApp template approved and added to the app", false,
      "No template exists for this message yet. Submit one in Meta, then add it to templates.ts. Until then the message is queued and recorded as no_approved_template.");
  }
  if (f.approvedTemplateNames === null) {
    return c(`template_${kind}`, `Templates approved in Meta: ${names.join(", ")}`, null,
      "Meta could not be asked. Check KAPSO_BUSINESS_ACCOUNT_ID.");
  }
  const missing = names.filter((n) => !f.approvedTemplateNames!.includes(n));
  return c(`template_${kind}`, `Templates approved in Meta: ${names.join(", ")}`, missing.length === 0,
    missing.length === 0
      ? "Approved."
      : `Not approved yet: ${missing.join(", ")}. If Meta shows them approved, the business account ID points at the wrong account.`);
}

/**
 * For features whose tables arrive with this session's migrations but which are
 * not part of the sending pipeline. Without it, a feature that silently
 * swallows write errors — correction capture does, by design — reads as
 * "working" on a database that has none of its tables.
 */
export function databaseUpdated(f: FeatureFacts, why: string): Condition {
  return c("migrations", "Database updated with the new tables", f.notificationTablesPresent, why);
}

export function assistantOn(f: FeatureFacts): Condition[] {
  return [
    c("ai_on", "WhatsApp assistant switched on (Drafts or Replies)", Boolean(f.ai && f.ai.mode !== "off"),
      "The assistant ignores every incoming message while off."),
    c("groq", "AI model key (GROQ_API_KEY) set", f.env.groqKey,
      "The assistant skips every message before calling the model, with no visible error."),
    c("webhook", "WhatsApp webhook secret set", f.env.kapsoWebhookSecret,
      "Incoming patient messages are rejected, so nothing reaches the assistant."),
  ];
}

export function assistantActs(f: FeatureFacts): Condition[] {
  return [
    ...assistantOn(f).slice(1),
    c("ai_auto", "WhatsApp assistant set to Replies", f.ai?.mode === "auto",
      "In Drafts mode staff must approve every reply, so nothing happens automatically."),
    c("booking_writes", "Assistant allowed to book and cancel", Boolean(f.ai?.allowBookingWrites),
      "It can talk about appointments but every change is held for staff."),
  ];
}
