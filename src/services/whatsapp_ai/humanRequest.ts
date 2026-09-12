/**
 * Does the patient want a person rather than the assistant?
 *
 * Checked before the model is called: someone asking for a human should get
 * one, not a model's opinion on whether they meant it. A false positive costs a
 * handoff, which is always safe; a false negative traps a patient with a bot.
 *
 * No \b in the Arabic patterns — JS word boundaries are ASCII-only and silently
 * disable a rule beside an Arabic letter. That has bitten this module twice.
 */
const HUMAN_REQUEST: RegExp[] = [
  /موظف/,
  /بشري/,
  /(شخص|انسان|إنسان)\s+(حقيقي|طبيعي)/,
  /(اكلم|أكلم|اتكلم|أتكلم|كلمني|كلم)\s+(حد|أحد|احد|موظف|انسان|إنسان|شخص)/,
  /خدمة\s+العملاء/,
  /(مش|مو|لا)\s+(عايز|عاوز|بدي|اريد|أريد)\s+(اكلم\s+|أكلم\s+|اتكلم\s+مع\s+|أتكلم\s+مع\s+)?(بوت|روبوت|آلي|الي|مساعد)/,
  /\bhuman\b/i,
  /\breal\s+person\b/i,
  /\b(live\s+)?agent\b/i,
  /\brepresentative\b/i,
  /\b(talk|speak|chat)\s+(to|with)\s+(someone|somebody|a\s+person|staff|a\s+human)\b/i,
  /\bnot\s+a\s+(bot|robot)\b/i,
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
  return HUMAN_REQUEST.some((re) => re.test(text));
}

export function showsFrustration(text: string): boolean {
  return FRUSTRATION.some((re) => re.test(text));
}
