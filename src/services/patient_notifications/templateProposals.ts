/**
 * The WhatsApp templates this clinic still has to submit.
 *
 * Six message types are queued by the system but can never be sent, because
 * Meta requires an approved template to start a conversation and none exists
 * for them. This is the text to submit, so the answer to "what do I write?"
 * lives beside the thing that is blocked rather than in someone's head.
 *
 * Names follow the ones already approved: one template per language, suffixed
 * _en and _ar, each registered under language en_US whatever the body says.
 */

export type TemplateProposal = {
  /** The outbox kind this unblocks. */
  kind: string;
  /** How the message is named in Settings. */
  title: string;
  names: { en: string; ar: string };
  category: "UTILITY" | "MARKETING";
  /** What {{1}}, {{2}}… stand for, in order. */
  params: string[];
  bodyEn: string;
  bodyAr: string;
};

export const TEMPLATE_PROPOSALS: readonly TemplateProposal[] = [
  {
    kind: "cancellation",
    title: "Cancellation notices",
    names: { en: "cancellation_en", ar: "cancellation_ar" },
    category: "UTILITY",
    params: ["patient name", "appointment date"],
    bodyEn: "Hi {{1}}, your appointment on {{2}} has been cancelled. Reply here to book a new time.",
    bodyAr: "أهلاً {{1}}، تم إلغاء ميعادك يوم {{2}}. ابعتلنا هنا لو حابب تحجز ميعاد جديد.",
  },
  {
    kind: "reschedule",
    title: "Reschedule notices",
    names: { en: "reschedule_en", ar: "reschedule_ar" },
    category: "UTILITY",
    params: ["patient name", "clinic name", "new date and time"],
    bodyEn: "Hi {{1}}, your appointment at {{2}} has moved to {{3}}. Reply here if that does not suit you.",
    bodyAr: "أهلاً {{1}}، ميعادك في {{2}} اتغير لـ {{3}}. ابعتلنا لو الميعاد مش مناسب.",
  },
  {
    kind: "waitlist_offer",
    title: "Waitlist offers",
    names: { en: "waitlist_offer_en", ar: "waitlist_offer_ar" },
    category: "UTILITY",
    params: ["patient name", "clinic name", "date and time of the free slot"],
    bodyEn: "Hi {{1}}, a spot opened at {{2}} on {{3}}. Reply yes within 30 minutes to take it.",
    bodyAr: "أهلاً {{1}}، في ميعاد فاضي في {{2}} يوم {{3}}. رد بأيوه خلال ٣٠ دقيقة لو عايزه.",
  },
  {
    kind: "followup",
    title: "Follow-ups after a visit",
    names: { en: "followup_en", ar: "followup_ar" },
    category: "UTILITY",
    params: ["patient name"],
    bodyEn: "Hi {{1}}, how are you feeling after your visit? Reply here if anything is bothering you.",
    bodyAr: "أهلاً {{1}}، عامل إيه بعد الزيارة؟ ابعتلنا لو في أي حاجة مضايقاك.",
  },
  {
    kind: "recall_6m",
    title: "Six-month recalls",
    names: { en: "recall_6m_en", ar: "recall_6m_ar" },
    category: "MARKETING",
    params: ["patient name", "clinic name"],
    bodyEn: "Hi {{1}}, it has been 6 months since your last visit to {{2}}. Would you like to book a check-up?",
    bodyAr: "أهلاً {{1}}، عدى ٦ شهور على آخر زيارة لـ {{2}}. تحب نحجزلك ميعاد كشف؟",
  },
  {
    kind: "review_request",
    title: "Review requests",
    names: { en: "review_request_en", ar: "review_request_ar" },
    category: "MARKETING",
    params: ["patient name", "review link"],
    bodyEn: "Thank you, {{1}}! If you have a moment, a review helps other patients find us: {{2}}",
    bodyAr: "شكراً يا {{1}}! لو عندك دقيقة، رأيك بيساعد ناس تانية تلاقينا: {{2}}",
  },
];

export function proposalForKind(kind: string): TemplateProposal | null {
  return TEMPLATE_PROPOSALS.find((p) => p.kind === kind) ?? null;
}

/**
 * The same six, as the runbook prints them.
 *
 * docs/PATIENT_NOTIFICATIONS.md embeds this between generated markers and a
 * test fails if the two drift, so whoever submits the templates reads the same
 * text the app is waiting for. Regenerate after editing this file:
 *   node --experimental-strip-types --import ./scripts/test-loader.mjs \
 *     scripts/write-template-proposals.mjs
 */
export function templateProposalsMarkdown(): string {
  return TEMPLATE_PROPOSALS.map((p) => {
    const params = p.params.map((name, i) => `\`{{${i + 1}}}\` ${name}`).join(" · ");
    return [
      `**${p.title}** — \`${p.names.en}\` and \`${p.names.ar}\` · ${p.category}`,
      "",
      params,
      "",
      "```",
      p.bodyEn,
      p.bodyAr,
      "```",
    ].join("\n");
  }).join("\n\n");
}
