/**
 * What the patient is told about a billing payment request and its receipt.
 *
 * Composed here, by the server, mirroring src/services/deposits/receiptMessages.ts
 * — same reasoning: amounts and account details must never be hallucinated.
 * Every one of these is either a reply to a message the patient just sent (the
 * receipt outcomes), or is checked against the 24h session window by the
 * caller before being sent as free text (the initial ask, unlike a deposit ask
 * which is always itself a reply).
 */

import { formatEgp, type Language } from "@/services/deposits/receiptMessages";

export type BillingInstructionsInput = {
  amountEgp: number;
  description: string;
  /** Where to transfer, already joined — see payment_methods/destinations. */
  destination: string;
  language: Language;
};

export function billingPaymentInstructions(input: BillingInstructionsInput): string {
  const amount = formatEgp(input.amountEgp, input.language);
  const to = input.destination.trim();

  if (input.language === "ar") {
    return [
      `فاتورتك ${amount} (${input.description}).`,
      to ? `تحويل على: ${to}` : "",
      `ابعتلنا صورة إيصال التحويل هنا وهنأكد استلام الفلوس.`,
    ]
      .filter(Boolean)
      .join("\n");
  }
  return [
    `Your bill is ${amount} (${input.description}).`,
    to ? `Transfer to: ${to}` : "",
    `Send us a screenshot of the receipt here and we'll confirm we received it.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export type BillingOutcomeInput = {
  reason: string;
  language: Language;
  amountEgp: number;
  paidEgp?: number | null;
};

const CONFIRMED: Record<Language, string> = {
  en: "Payment received — thank you!",
  ar: "استلمنا التحويل — شكراً!",
};

const REVIEW: Record<Language, string> = {
  en: "Thanks — we've got your receipt and a colleague is checking it now.",
  ar: "شكراً — وصلنا الإيصال وزميلنا بيراجعه حالاً.",
};

const NOT_A_RECEIPT: Record<Language, string> = {
  en: "Thanks, but that doesn't look like a transfer receipt. Could you send the screenshot from your banking or wallet app?",
  ar: "شكراً، بس الصورة دي مش إيصال تحويل. تقدر تبعت صورة الإيصال من تطبيق البنك أو المحفظة؟",
};

const DUPLICATE: Record<Language, string> = {
  en: "We've already received this exact receipt. If you've made a second transfer, please send that receipt instead.",
  ar: "الإيصال ده وصلنا قبل كده. لو عملت تحويل تاني، ابعتلنا إيصاله.",
};

function shortfall(input: BillingOutcomeInput): string {
  const asked = formatEgp(input.amountEgp, input.language);
  if (typeof input.paidEgp !== "number") {
    return input.language === "ar"
      ? `المبلغ اللي في الإيصال أقل من الفاتورة (${asked}). تقدر تبعت فرق المبلغ وإيصاله؟`
      : `The amount on that receipt is less than the ${asked} bill. Could you send the difference and its receipt?`;
  }
  const paid = formatEgp(input.paidEgp, input.language);
  const rest = formatEgp(Math.max(input.amountEgp - input.paidEgp, 0), input.language);
  return input.language === "ar"
    ? `الإيصال بيقول ${paid}، والفاتورة ${asked}. فاضل ${rest} — ابعتلنا إيصالهم لما تحوّلهم.`
    : `That receipt shows ${paid}, and the bill is ${asked}. That leaves ${rest} — send us the receipt once you've transferred it.`;
}

/**
 * The message for one verdict reason. Anything unrecognised falls back to
 * the "a colleague is checking" wording — the safe default.
 */
export function billingReceiptOutcomeMessage(input: BillingOutcomeInput): string {
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
    default:
      return REVIEW[l];
  }
}
