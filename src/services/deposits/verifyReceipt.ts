/**
 * Whether a receipt screenshot pays for a deposit.
 *
 * Pure, and deliberately the only thing in this feature allowed to decide. The
 * model that read the image only reports fields; a patient can write anything
 * into an image they send, so nothing the model says is trusted further than
 * being compared against the clinic's own settings and the database.
 *
 * Three verdicts, and the difference between two of them is the whole design:
 *   reject  — we are sure, and saying so helps the patient act
 *   review  — we are not sure, so a person looks and the slot stays held
 *   confirm — every check passed
 *
 * Unsure is by far the most common failure, and it must never cost a patient
 * their appointment. So the only rejections are the unambiguous ones: a replay,
 * and an amount plainly below what was asked.
 *
 * Evaluation order is part of the contract and is asserted in the tests.
 * Replays first, so a flawless-looking duplicate cannot talk its way past.
 */

import type { Corroboration } from "./ocrCorroborate";
import { foldArabicDigits } from "@/lib/text/arabicDigits";
import type { ReceiptExtraction } from "./receiptSchema";

/** Clock skew between a bank's server and ours; not an attack surface. */
const FUTURE_TOLERANCE_MS = 15 * 60 * 1000;

/** How the Egyptian pound prints on a receipt. */
const EGP_SPELLINGS = ["egp", "ج.م", "جم", "جنيه", "le", "l.e.", "l.e", "e£", "£e"];

export type VerifyInput = {
  extracted: ReceiptExtraction;
  required: {
    amountEgp: number;
    toleranceEgp: number;
    minConfidence: number;
    receiptMaxAgeHours: number;
    instapayHandle: string;
    walletNumber: string;
    recipientNames: string[];
  };
  /** When the deposit was asked for; a receipt long predating it is recycled. */
  request: { createdAt: string };
  /** Looked up by the caller, because this function touches no database. */
  seen: { imageUsed: boolean; referenceUsed: boolean };
  /**
   * A second, independent reading of the same image, when one was taken.
   * Absent or abstaining changes nothing: it can only ever add a doubt.
   */
  corroboration?: Corroboration;
  autoConfirm: boolean;
  now: Date;
};

export type Verdict = {
  verdict: "confirm" | "review" | "reject";
  reason: string;
};

/** Lowercased, digits folded, and stripped of the punctuation receipts add. */
function normalise(value: string): string {
  return foldArabicDigits(value)
    .toLowerCase()
    .replace(/[\s.\-_()،,]/g, "")
    // Arabic diacritics and tatweel, which print inconsistently.
    .replace(/[ـً-ْ]/g, "");
}

const digitsOf = (value: string) => foldArabicDigits(value).replace(/\D/g, "");

/**
 * Does this printed recipient name or handle belong to the clinic?
 *
 * A wallet number is compared by its last eight digits — the same convention
 * the rest of the app uses for phones, because a receipt may print +20 1xx,
 * 01xx or 201xx for one account. Names are compared by containment in either
 * direction: a receipt prints "THE DENTAL LOUNGE" for a clinic configured as
 * "Dental Lounge", and requiring equality would fail every real receipt.
 */
function matchesClinic(candidate: string, required: VerifyInput["required"]): boolean {
  const value = normalise(candidate);
  if (!value) return false;

  const handle = normalise(required.instapayHandle);
  if (handle && value === handle) return true;

  const wallet = digitsOf(required.walletNumber);
  const candidateDigits = digitsOf(candidate);
  if (wallet.length >= 8 && candidateDigits.length >= 8) {
    if (wallet.slice(-8) === candidateDigits.slice(-8)) return true;
  }

  for (const name of required.recipientNames) {
    const wanted = normalise(name);
    // Two characters would match half the receipts in Egypt.
    if (wanted.length < 3) continue;
    if (value.includes(wanted) || wanted.includes(value)) return true;
  }
  return false;
}

export function verifyReceipt(input: VerifyInput): Verdict {
  const { extracted: r, required, seen, now } = input;

  const reject = (reason: string): Verdict => ({ verdict: "reject", reason });
  const review = (reason: string): Verdict => ({ verdict: "review", reason });

  // 1-2. Replay. Checked before everything else, including before we look at
  // whether the image is a receipt at all: these are the only two things we can
  // be certain about, and certainty is what earns a rejection.
  if (seen.imageUsed) return reject("duplicate_image");
  if (seen.referenceUsed) return reject("duplicate_reference");

  // 3. Not a receipt. A person looks — a patient who sent the wrong picture
  // should be asked again, not have their appointment torn down.
  if (!r.isReceipt) return review("not_a_receipt");

  // 4. A receipt does not contain instructions. Anything instruction-shaped
  // means someone wrote to the model rather than to the clinic.
  if (r.suspiciousText.trim() !== "") return review("suspicious_text");

  // 5. Our own uncertainty.
  if (r.confidence < required.minConfidence) return review("low_confidence");

  // 6. The amount.
  if (r.amount === null) return review("amount_unreadable");
  const floor = required.amountEgp - required.toleranceEgp;
  const ceiling = required.amountEgp + required.toleranceEgp;
  if (r.amount < floor) return reject("amount_short");
  if (r.amount > ceiling) return review("amount_over");

  // 7. The currency, only when the receipt actually printed one.
  if (r.currency !== null) {
    const printed = normalise(r.currency);
    if (printed && !EGP_SPELLINGS.some((s) => printed.includes(normalise(s)))) {
      return review("currency_mismatch");
    }
  }

  // 8. Who was paid. Either field may carry it, depending on the app.
  const candidates = [r.recipientHandle, r.recipientName].filter(
    (v): v is string => typeof v === "string" && v.trim() !== "",
  );
  if (candidates.length === 0) return review("recipient_unreadable");
  if (!candidates.some((c) => matchesClinic(c, required))) {
    return review("recipient_mismatch");
  }

  // 9. When it happened.
  if (r.transferredAt === null) return review("timestamp_unreadable");
  const paidAt = Date.parse(r.transferredAt);
  if (paidAt > now.getTime() + FUTURE_TOLERANCE_MS) return review("timestamp_future");
  const oldestAllowed =
    Date.parse(input.request.createdAt) - required.receiptMaxAgeHours * 60 * 60 * 1000;
  if (paidAt < oldestAllowed) return review("receipt_too_old");

  // 10. No reference means single use cannot be enforced on this receipt, so it
  // can never be accepted automatically however good it looks.
  if (r.reference === null) return review("reference_unreadable");

  // 11. A second reader could not find what the model reported. This is the one
  // check aimed at the model rather than the patient: OCR cannot spot a forgery,
  // but it can spot a number that is not physically printed on the image.
  const corroboration = input.corroboration;
  if (corroboration?.checked) {
    if (corroboration.missing.includes("amount")) return review("ocr_amount_mismatch");
    if (corroboration.missing.includes("reference")) return review("ocr_reference_mismatch");
  }

  // 12. The clinic has not handed over the decision yet.
  if (!input.autoConfirm) return review("manual_review_mode");

  return { verdict: "confirm", reason: "ok" };
}
