/**
 * Every WhatsApp template this clinic needs, and whether Meta has it.
 *
 * The information existed in three places and nowhere together: which
 * templates the code sends with, which Meta has approved, and the text to
 * submit for the ones nobody has created. Answering "what am I missing" meant
 * reading two source files and the Meta console side by side.
 *
 * Pure, so the answer can be tested without asking Meta anything.
 */

import { PATIENT_TEMPLATES } from "./templates";
import { TEMPLATE_PROPOSALS, type TemplateProposal } from "./templateProposals";

export type TemplateStatus =
  /** Registered in the code and approved in Meta: usable today. */
  | "approved"
  /** Registered in the code, but Meta does not list it as approved. */
  | "missing"
  /** Nothing has been submitted; the text to submit is in `proposal`. */
  | "not_submitted"
  /** Meta could not be asked, so its state is unknown. */
  | "unknown";

export type RequiredTemplate = {
  /** The message this template carries, e.g. "reminder_24h". */
  kind: string;
  /** What the clinic calls it. */
  title: string;
  /** The name registered in Meta, or the proposed one when not submitted. */
  name: string;
  /** The language the body is written in, which is not its Meta language. */
  bodyLanguage: "ar" | "en";
  status: TemplateStatus;
  /** Present only when there is nothing to approve yet. */
  proposal: TemplateProposal | null;
};

/** How each kind reads on the checklist, so both call it the same thing. */
const TITLES: Record<string, string> = {
  confirmation: "Booking confirmations",
  reminder_24h: "Day-before reminders",
  cancellation: "Cancellation notices",
  reschedule: "Reschedule notices",
  waitlist_offer: "Waitlist offers",
  followup: "Post-visit follow-ups",
  recall_6m: "Six-month check-up recalls",
  review_request: "Review requests",
};

const titleFor = (kind: string) => TITLES[kind] ?? kind;

/**
 * The full picture, in the order a clinic would work through it.
 *
 * `approvedNames` is what Meta returned, or null when it could not be asked —
 * which becomes "unknown" rather than "missing", because not having looked is
 * not the same as having looked and found nothing.
 */
export function collectRequiredTemplates(
  approvedNames: string[] | null,
): RequiredTemplate[] {
  const registered: RequiredTemplate[] = PATIENT_TEMPLATES.map((template) => ({
    kind: template.kind,
    title: titleFor(template.kind),
    name: template.name,
    bodyLanguage: template.bodyLanguage,
    status:
      approvedNames === null
        ? "unknown"
        : approvedNames.includes(template.name)
          ? "approved"
          : "missing",
    proposal: null,
  }));

  const proposed: RequiredTemplate[] = TEMPLATE_PROPOSALS.flatMap((proposal) => [
    {
      kind: proposal.kind,
      title: titleFor(proposal.kind),
      name: proposal.names.en,
      bodyLanguage: "en" as const,
      status: "not_submitted" as const,
      proposal,
    },
    {
      kind: proposal.kind,
      title: titleFor(proposal.kind),
      name: proposal.names.ar,
      bodyLanguage: "ar" as const,
      status: "not_submitted" as const,
      proposal,
    },
  ]);

  // Anything needing action first: nothing submitted, then submitted but not
  // approved, then the ones already working.
  const order: Record<TemplateStatus, number> = {
    not_submitted: 0,
    missing: 1,
    unknown: 2,
    approved: 3,
  };
  return [...registered, ...proposed].sort(
    (a, b) => order[a.status] - order[b.status] || a.name.localeCompare(b.name),
  );
}

export type TemplateTally = Record<TemplateStatus, number>;

export function tallyTemplates(rows: RequiredTemplate[]): TemplateTally {
  const tally: TemplateTally = { approved: 0, missing: 0, not_submitted: 0, unknown: 0 };
  for (const row of rows) tally[row.status] += 1;
  return tally;
}
