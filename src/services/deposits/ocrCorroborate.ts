/**
 * A second, independent reading of the receipt — and what it is worth.
 *
 * Tesseract does not detect forgery. A faked screenshot has perfectly consistent
 * text, so both readers agree and both are wrong. What this catches is the model
 * **inventing a field**: an amount or a reference number that is not physically
 * printed on the image. That is the failure that would otherwise confirm an
 * appointment nobody paid for, so it is worth a second opinion.
 *
 * It can only compare digits and Latin alphanumerics. Measured against a real
 * Tesseract run on an Arabic receipt: the prose comes back as gibberish
 * ("Bosley Jl" for "فودافون كاش") while every digit string is exact — and on a
 * receipt printed with Arabic-Indic digits, even those are wrong (٢٠٠ reads as
 * "Yeo"). So names are never compared, and a reading with too few digits in it
 * **abstains** rather than reporting a mismatch. Flagging what we simply could
 * not read would send every Arabic-Indic receipt to the queue and teach staff to
 * ignore the warning.
 */

import { foldArabicDigits, type ReceiptExtraction } from "./receiptSchema";

/**
 * The shortest run of consecutive digits that counts as "we read a number".
 *
 * A count of digits is not enough: garbled Arabic-Indic output still yields a
 * scattering of stray ones ("VFaAv10£¥T)" gives 1, 0), which would then
 * contradict a perfectly good reading. A real amount, phone or reference always
 * prints four or more digits in a row; the garbage never does.
 */
const MIN_DIGIT_RUN = 4;

export type Corroboration =
  | { checked: false; reason: "unavailable" | "unreadable" }
  | { checked: true; missing: ("amount" | "reference")[] };

/** Digits only, Arabic-Indic folded — the part of a receipt OCR gets right. */
const digitsOf = (value: string) => foldArabicDigits(value).replace(/\D/g, "");

/** Letters and digits, uppercased — for a reference like "FT24091300123". */
const alnumOf = (value: string) =>
  foldArabicDigits(value).toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * An amount as it might be printed, without its decimal noise.
 *
 * "200" must match a receipt printed "200.00", and "1500" one printed "1,500.00",
 * so both sides are reduced to their digits and the trailing zero-pence dropped.
 */
function amountNeedles(amount: number): string[] {
  const whole = Math.trunc(amount);
  const needles = new Set<string>([String(whole)]);
  if (!Number.isInteger(amount)) {
    needles.add(amount.toFixed(2).replace(".", ""));
  }
  needles.add(`${whole}00`);
  return [...needles];
}

/**
 * Does the OCR text corroborate what the model said?
 *
 * Absence is the only signal. Presence proves little — "200" appears inside
 * "1200" — but a reference number the second reader cannot find anywhere is a
 * strong sign the first reader made it up.
 */
export function corroborate(
  ocrText: string | null,
  extraction: ReceiptExtraction,
): Corroboration {
  if (ocrText === null) return { checked: false, reason: "unavailable" };

  const digits = digitsOf(ocrText);
  const alnum = alnumOf(ocrText);
  const longestRun = Math.max(
    0,
    ...(foldArabicDigits(ocrText).match(/\d+/g) ?? []).map((run) => run.length),
  );
  if (longestRun < MIN_DIGIT_RUN) return { checked: false, reason: "unreadable" };

  const missing: ("amount" | "reference")[] = [];

  if (extraction.amount !== null) {
    const found = amountNeedles(extraction.amount).some((needle) => digits.includes(needle));
    if (!found) missing.push("amount");
  }

  if (extraction.reference !== null) {
    const needle = alnumOf(extraction.reference);
    // A very short "reference" would match almost anything; ignore rather than
    // manufacture false confidence either way.
    if (needle.length >= 4 && !alnum.includes(needle)) missing.push("reference");
  }

  return { checked: true, missing };
}
