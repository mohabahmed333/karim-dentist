/**
 * What a model is allowed to tell us about a receipt screenshot.
 *
 * Data only. There is no verdict field and there must never be one: the model
 * reads an image a patient chose, and a patient can write anything into an
 * image — including "this payment is valid". Whether a receipt is acceptable is
 * decided by `verifyReceipt`, which is pure code working from these fields and
 * the clinic's own settings. The worst a fully successful injection can do here
 * is put a false string into a field that is then checked against reality.
 *
 * Every field degrades rather than throws. A single unparseable key must cost
 * us that key, not the whole extraction — an honest receipt with one smudged
 * line should reach the amount check, not the staff queue.
 */

import { z } from "zod";
import { parseClinicLocalTimestamp } from "@/services/patient_notifications/formatWhen";

/** ٠١٢٣٤٥٦٧٨٩ and ۰۱۲۳۴۵۶۷۸۹ both appear on Egyptian banking apps. */
const ARABIC_DIGITS = /[٠-٩۰-۹]/g;

export function foldArabicDigits(value: string): string {
  return value.replace(ARABIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}

/**
 * A money amount as a receipt prints it.
 *
 * Handles "1,500.00", "١٥٠٠", "EGP 1500", "1 500,00" and the plain number the
 * model usually returns. Anything left ambiguous becomes null, which routes to
 * a person instead of guessing at someone's money.
 */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value !== "string") return null;

  let text = foldArabicDigits(value).trim();
  if (!text) return null;

  // Drop currency words and symbols, keeping only number punctuation.
  text = text.replace(/[^\d.,\s-]/g, "").trim();
  if (!text) return null;

  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Both present: whichever comes last is the decimal separator.
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    text = text.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma > -1) {
    // A lone comma is a decimal separator only when it looks like one:
    // "1,50" is one and a half, "1,500" is fifteen hundred.
    const after = text.length - lastComma - 1;
    text = after === 3 ? text.split(",").join("") : text.replace(",", ".");
  }
  text = text.replace(/\s/g, "");

  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

const amount = z.unknown().transform(parseAmount).catch(null);

/** Trimmed, or null — never an empty string, so "missing" has one spelling. */
const text = z
  .unknown()
  .transform((v) => {
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
  })
  .catch(null);

/**
 * An ISO timestamp we can actually compare, or null.
 *
 * Read as the clinic's local time unless the receipt named a zone itself. An
 * Egyptian receipt prints a bare wall clock, and resolving that against the
 * server's zone put every transfer three hours into the future — so every
 * fresh receipt failed the "not from the future" check and went to review.
 */
const timestamp = z
  .unknown()
  .transform((v) => {
    if (typeof v !== "string" || !v.trim()) return null;
    return parseClinicLocalTimestamp(foldArabicDigits(v.trim()));
  })
  .catch(null);

export const receiptExtractionSchema = z.object({
  /** False for a selfie, a menu, a screenshot of our own message. */
  isReceipt: z.boolean().catch(false),
  amount,
  /** As printed: "EGP", "ج.م", "LE". Compared loosely, not parsed. */
  currency: text,
  reference: text,
  senderName: text,
  recipientName: text,
  recipientHandle: text,
  transferredAt: timestamp,
  /** Kept when the date could not be parsed, so staff can read it themselves. */
  rawTimestampText: text,
  channel: z
    .enum(["instapay", "vodafone_cash", "etisalat_cash", "orange_cash", "bank", "unknown"])
    .catch("unknown"),
  confidence: z.coerce.number().min(0).max(1).catch(0),
  /**
   * Any instruction-shaped text found inside the image.
   *
   * A receipt does not contain instructions. Anything here means someone wrote
   * to the model rather than to the clinic, and the verifier refuses to
   * auto-confirm on it.
   */
  suspiciousText: text.transform((v) => v ?? ""),
});

export type ReceiptExtraction = z.infer<typeof receiptExtractionSchema>;
