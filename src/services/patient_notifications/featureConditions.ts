/**
 * The individual conditions a feature depends on.
 *
 * Each condition is a real, named reason a feature can silently fail to work.
 * `met` is three-valued on purpose: `null` means "cannot be checked
 * automatically" — patient consent, or a fact only a person can confirm — and
 * must never be shown as satisfied.
 */

import { PATIENT_TEMPLATES } from "./templates";
import { proposalForKind, type TemplateProposal } from "./templateProposals";

export type Condition = {
  key: string;
  label: string;
  met: boolean | null;
  /** What goes wrong without it. */
  why: string;
  /** What someone has to do to make it true — shown behind the "?" in Settings. */
  fix: string;
  /** For a message with no template yet: the text to submit to Meta. */
  proposal?: TemplateProposal;
};

export type AiMode = "off" | "draft_only" | "auto";

export type FeatureFacts = {
  env: {
    cronSecret: boolean;
    kapso: boolean;
    kapsoWebhookSecret: boolean;
    serviceRole: boolean;
    aiKey: boolean;
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

const c = (key: string, label: string, met: boolean | null, why: string, fix: string): Condition => ({
  key,
  label,
  met,
  why,
  fix,
});

export const FIX = {
  migrations: "Run `supabase db push --linked` to apply the database changes to production.",
  modeSend: "Set Mode to Send in this tab, then Save.",
  cronSecret: "Add CRON_SECRET in Vercel → Settings → Environment Variables (Production), then redeploy.",
  scheduler: "In the Supabase SQL editor, create the two Vault secrets, then run supabase/scripts/schedule_notifications_dispatch.sql once.",
  whatsapp: "Add KAPSO_API_KEY and KAPSO_PHONE_NUMBER_ID in Vercel (Production), then redeploy.",
  serviceRole: "Add SUPABASE_SERVICE_ROLE_KEY in Vercel (Production), then redeploy.",
  noTemplate: "Open this row for the exact text to submit, paste it into Meta Business Manager, then add the approved name to PATIENT_TEMPLATES in templates.ts.",
  businessAccount: "Set KAPSO_BUSINESS_ACCOUNT_ID to the clinic's own WhatsApp Business Account ID.",
  aiOn: "Settings → WhatsApp AI: set the assistant to Drafts or Replies.",
  groq: "Add GEMINI_API_KEY in Vercel (Production) — or MISTRAL_API_KEY, GROQ_API_KEY — then redeploy.",
  webhook: "Add KAPSO_WEBHOOK_SECRET in Vercel, and point the Kapso webhook at /api/v1/whatsapp/webhook.",
  aiAuto: "Settings → WhatsApp AI: set the assistant to Replies.",
  bookingWrites: "Settings → WhatsApp AI: allow the assistant to book and cancel appointments.",
} as const;

/** Everything any outbound message needs, before its own template. */
export function sendPipeline(f: FeatureFacts): Condition[] {
  return [
    c("migrations", "Database updated with the notification tables", f.notificationTablesPresent,
      "Without them nothing is queued at all.", FIX.migrations),
    c("mode_send", "Patient notifications switched to Send", f.notifications?.mode === "send",
      "Off queues nothing that will ever send; Dry run renders messages but sends none.", FIX.modeSend),
    c("cron_secret", "CRON_SECRET set on the server", f.env.cronSecret,
      "The dispatch endpoint refuses every call without it.", FIX.cronSecret),
    c("scheduler", "Scheduler calls the dispatcher every minute", f.cronScheduled,
      "Messages wait in the queue forever.", FIX.scheduler),
    c("whatsapp", "WhatsApp (Kapso) credentials set", f.env.kapso,
      "Every message is postponed with no_transport.", FIX.whatsapp),
    c("service_role", "Supabase service role key set", f.env.serviceRole,
      "The dispatcher cannot read the queue.", FIX.serviceRole),
  ];
}

/**
 * Whether this message type has a template the app can send.
 *
 * A kind absent from PATIENT_TEMPLATES has no template name at all, so Meta
 * cannot even be asked about it — the honest answer is "not set up", not
 * "unknown".
 */
/** The label of a template condition for a message type with no template at all. */
/**
 * Deliberately not "approved": nothing has been submitted for these, and the
 * old wording sent staff to Meta to look for an approval that was never pending.
 */
export const NO_TEMPLATE_LABEL = "No template submitted for this message";

export function templateCondition(kind: string, f: FeatureFacts): Condition {
  const names = PATIENT_TEMPLATES.filter((t) => t.kind === kind).map((t) => t.name);
  if (names.length === 0) {
    return {
      ...c(`template_${kind}`, NO_TEMPLATE_LABEL, false,
        "Meta only lets the clinic start a conversation with an approved template, and none has been submitted for this message. Until then it is queued and recorded as no_approved_template.",
        FIX.noTemplate),
      proposal: proposalForKind(kind) ?? undefined,
    };
  }
  if (f.approvedTemplateNames === null) {
    return c(`template_${kind}`, `Templates approved in Meta: ${names.join(", ")}`, null,
      "Meta could not be asked which templates are approved.", FIX.businessAccount);
  }
  const missing = names.filter((n) => !f.approvedTemplateNames!.includes(n));
  return c(`template_${kind}`, `Templates approved in Meta: ${names.join(", ")}`, missing.length === 0,
    missing.length === 0 ? "Approved." : `Not approved yet: ${missing.join(", ")}.`,
    missing.length === 0
      ? "Nothing to do."
      : `Wait for Meta to approve ${missing.join(", ")}. If Meta already shows them approved, correct KAPSO_BUSINESS_ACCOUNT_ID.`);
}

/**
 * For features whose tables arrive with this session's migrations but which are
 * not part of the sending pipeline. Without it, a feature that silently
 * swallows write errors — correction capture does, by design — reads as
 * "working" on a database that has none of its tables.
 */
export function databaseUpdated(f: FeatureFacts, why: string): Condition {
  return c("migrations", "Database updated with the new tables", f.notificationTablesPresent, why, FIX.migrations);
}

export function assistantOn(f: FeatureFacts): Condition[] {
  return [
    c("ai_on", "WhatsApp assistant switched on (Drafts or Replies)", Boolean(f.ai && f.ai.mode !== "off"),
      "The assistant ignores every incoming message while off.", FIX.aiOn),
    c("groq", "AI model key set (Gemini, Mistral or Groq)", f.env.aiKey,
      "The assistant skips every message before calling the model, with no visible error.", FIX.groq),
    c("webhook", "WhatsApp webhook secret set", f.env.kapsoWebhookSecret,
      "Incoming patient messages are rejected, so nothing reaches the assistant.", FIX.webhook),
  ];
}

export function assistantActs(f: FeatureFacts): Condition[] {
  return [
    ...assistantOn(f).slice(1),
    c("ai_auto", "WhatsApp assistant set to Replies", f.ai?.mode === "auto",
      "In Drafts mode staff must approve every reply, so nothing happens automatically.", FIX.aiAuto),
    c("booking_writes", "Assistant allowed to book and cancel", Boolean(f.ai?.allowBookingWrites),
      "It can talk about appointments but every change is held for staff.", FIX.bookingWrites),
  ];
}
