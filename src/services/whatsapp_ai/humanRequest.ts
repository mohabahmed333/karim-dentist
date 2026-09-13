import { normalizeArabic } from "./normalizeArabic";

/**
 * Does the patient want a person rather than the assistant?
 *
 * Checked before the model is called: someone asking for a human should get
 * one, not a model's opinion on whether they meant it. A false positive costs a
 * handoff, which is always safe; a false negative traps a patient with a bot.
 *
 * Every Arabic pattern is written against normalizeArabic()'s output, not
 * against how the word is properly spelled — a patient typing "انسان" for
 * "إنسان" is not making an error worth noticing, and a pattern written for
 * only the "correct" spelling would silently miss the far more common one.
 * That also means most hamza/ة variants that used to be spelled out by hand
 * ("أحد|احد", "موظف" alone was already safe) collapse to one alternative here.
 *
 * No \b in the Arabic patterns — JS word boundaries are ASCII-only and silently
 * disable a rule beside an Arabic letter. That has bitten this module twice.
 */
const HUMAN_REQUEST: RegExp[] = [
  /موظف/,
  /بشري/,
  /(شخص|انسان)\s+(حقيقي|طبيعي)/,
  // "مع" (with) is optional: "اتكلم حد" and "اتكلم مع حد" are the same request.
  // "حد" and "احد" are two different words for "someone", not a hamza spelling
  // of the same one — folding must not merge them into a single alternative.
  /(اكلم|اتكلم|كلمني|كلم)\s+(مع\s+)?(حد|احد|موظف|انسان|شخص)/,
  /خدمه\s+العملاء/,
  /(مش|مو|لا)\s+(عايز|عاوز|بدي|اريد)\s+(اكلم\s+|اتكلم\s+مع\s+)?(بوت|روبوت|الي|مساعد)/,
  /\bhuman\b/i,
  /\breal\s+person\b/i,
  /\b(live\s+)?agent\b/i,
  /\brepresentative\b/i,
  /\b(talk|speak|chat)\s+(to|with)\s+(someone|somebody|a\s+person|staff|a\s+human)\b/i,
  /\bnot\s+a\s+(bot|robot)\b/i,
  // "I don't want a bot" is the same request as "get me a human", and the
  // Arabic list already covers its equivalent.
  /\b(don'?t|do\s+not|dont)\s+want\s+(to\s+(talk|speak|chat)\s+(to|with)\s+)?an?\s+(bot|robot|machine)\b/i,
];

/**
 * Signs the conversation is going badly. These do not hand off on their own —
 * they count toward offering a person, so one "??" does not end the chat.
 */
const FRUSTRATION: RegExp[] = [
  /[؟?]{2,}/,
  /مش\s+(فاهم|فاهمني|بترد|مفهوم)/,
  /\b(you\s+don'?t\s+understand|not\s+helpful|useless|this\s+is\s+not\s+working)\b/i,
];

export function wantsHuman(text: string): boolean {
  const probe = normalizeArabic(text);
  return HUMAN_REQUEST.some((re) => re.test(probe));
}

export function showsFrustration(text: string): boolean {
  const probe = normalizeArabic(text);
  return FRUSTRATION.some((re) => re.test(probe));
}
