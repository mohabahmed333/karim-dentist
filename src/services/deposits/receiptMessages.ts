/**
 * What the patient is told after they send a receipt.
 *
 * Composed here, by the server, rather than by the model. These messages carry
 * amounts and a decision about someone's appointment, and a model that
 * paraphrases "we could not read your receipt" into "your payment failed" would
 * do real damage. They are also plain functions, so the wording is reviewable
 * and testable rather than buried in a prompt.
 *
 * Every one of these is a reply to a message the patient just sent, so it goes
 * out as free text. Meta only requires an approved template to *start* a
 * conversation, which is why this whole feature needs no template.
 */

export type Language = "ar" | "en";

/** Money as a patient would read it: no trailing .00, thousands separated. */
export function formatEgp(amount: number, language: Language): string {
  const locale = language === "ar" ? "ar-EG-u-nu-latn" : "en-EG";
  const text = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return language === "ar" ? `${text} جنيه` : `EGP ${text}`;
}

export type InstructionsInput = {
  amountEgp: number;
  instapayHandle: string;
  walletNumber: string;
  holdMinutes: number;
  language: Language;
};

/**
 * The ask, appended to the assistant's own booking reply.
 *
 * Server-composed so the amount and the account can never be hallucinated —
 * the one thing in this flow where a model's mistake would send a patient's
 * money to the wrong place.
 */
export function depositInstructions(input: InstructionsInput): string {
  const amount = formatEgp(input.amountEgp, input.language);
  const destinations: string[] = [];
  if (input.instapayHandle.trim()) destinations.push(input.instapayHandle.trim());
  if (input.walletNumber.trim()) destinations.push(input.walletNumber.trim());
  const to = destinations.join(" — ");

  if (input.language === "ar") {
    return [
      `للتأكيد، محتاجين مقدم ${amount}.`,
      to ? `تحويل على: ${to}` : "",
      `ابعتلنا صورة الإيصال هنا، والميعاد محفوظلك ${input.holdMinutes} دقيقة.`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `To confirm, we need a ${amount} deposit.`,
    to ? `Transfer to: ${to}` : "",
    `Send us a screenshot of the receipt here and we'll hold the slot for ${input.holdMinutes} minutes.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type OutcomeInput = {
  reason: string;
  language: Language;
  /** What was asked for, and what the receipt appeared to say. */
  amountEgp: number;
  paidEgp?: number | null;
};

const CONFIRMED: Record<Language, string> = {
  en: "Payment received — your appointment is confirmed. See you then!",
  ar: "استلمنا التحويل — ميعادك مؤكد. في انتظارك!",
};

const REVIEW: Record<Language, string> = {
  en: "Thanks — we've got your receipt and a colleague is checking it now. Your slot is still held.",
  ar: "شكراً — وصلنا الإيصال وزميلنا بيراجعه حالاً. ميعادك لسه محفوظ.",
};

const NOT_A_RECEIPT: Record<Language, string> = {
  en: "Thanks, but that doesn't look like a transfer receipt. Could you send the screenshot from your banking or wallet app?",
  ar: "شكراً، بس الصورة دي مش إيصال تحويل. تقدر تبعت صورة الإيصال من تطبيق البنك أو المحفظة؟",
};

const DUPLICATE: Record<Language, string> = {
  en: "We've already received this exact receipt. If you've made a second transfer, please send that receipt instead.",
  ar: "الإيصال ده وصلنا قبل كده. لو عملت تحويل تاني، ابعتلنا إيصاله.",
};

const EXPIRED: Record<Language, string> = {
  en: "Sorry — the hold on that time ran out, so it's been released. Message us and we'll find you another slot.",
  ar: "معلش — مدة حجز الميعاد خلصت والميعاد رجع متاح. ابعتلنا ونلاقيلك ميعاد تاني.",
};

function shortfall(input: OutcomeInput): string {
  const asked = formatEgp(input.amountEgp, input.language);
  if (typeof input.paidEgp !== "number") {
    return input.language === "ar"
      ? `المبلغ اللي في الإيصال أقل من المقدم المطلوب (${asked}). تقدر تبعت فرق المبلغ وإيصاله؟`
      : `The amount on that receipt is less than the ${asked} deposit. Could you send the difference and its receipt?`;
  }
  const paid = formatEgp(input.paidEgp, input.language);
  const rest = formatEgp(Math.max(input.amountEgp - input.paidEgp, 0), input.language);
  return input.language === "ar"
    ? `الإيصال بيقول ${paid}، والمقدم ${asked}. فاضل ${rest} — ابعتلنا إيصالهم لما تحوّلهم.`
    : `That receipt shows ${paid}, and the deposit is ${asked}. That leaves ${rest} — send us the receipt once you've transferred it.`;
}

/**
 * The message for one verdict reason.
 *
 * Anything unrecognised falls back to the "a colleague is checking" wording,
 * which is the safe default: it tells the truth about an unclear case and never
 * claims the money was refused.
 */
export function receiptOutcomeMessage(input: OutcomeInput): string {
  const l = input.language;
  switch (input.reason) {
    case "ok":
      return CONFIRMED[l];
    case "amount_short":
      return shortfall(input);
    case "duplicate_image":
    case "duplicate_reference":
      return DUPLICATE[l];
    case "not_a_receipt":
      return NOT_A_RECEIPT[l];
    case "hold_expired":
      return EXPIRED[l];
    default:
      return REVIEW[l];
  }
}
