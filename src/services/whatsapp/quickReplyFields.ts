/**
 * Fill-in fields for WhatsApp quick replies: `{{name}}`, `{{next_appointment}}`…
 *
 * Only the fields listed here are recognised. A known field with no value is
 * left in the text as-is, and the composer refuses to send while one remains:
 * a half-filled "see you on {{next_appointment}}" must never reach a patient.
 * Anything else in braces is ordinary text to the composer, but the editor
 * rejects it on save, so a typo like {{nmae}} is caught before anyone uses it.
 */
export const QUICK_REPLY_FIELDS = [
  "name",
  "next_appointment",
  "appointment_service",
  "clinic_address",
  "clinic_phone",
  "clinic_hours",
  "maps_link",
] as const;

export type QuickReplyField = (typeof QUICK_REPLY_FIELDS)[number];
export type QuickReplyValues = Partial<Record<QuickReplyField, string>>;

const TOKEN = /\{\{\s*([a-zA-Z_]+)\s*\}\}/g;

export function isQuickReplyField(key: string): key is QuickReplyField {
  return (QUICK_REPLY_FIELDS as readonly string[]).includes(key);
}

export function renderQuickReply(
  body: string,
  values: QuickReplyValues,
): { text: string; missing: QuickReplyField[] } {
  const missing = new Set<QuickReplyField>();
  const text = body.replace(TOKEN, (match, key: string) => {
    if (!isQuickReplyField(key)) return match;
    const value = values[key]?.trim();
    if (value) return value;
    missing.add(key);
    return `{{${key}}}`;
  });
  return { text, missing: [...missing] };
}

export function findUnfilledFields(text: string): QuickReplyField[] {
  const found = new Set<QuickReplyField>();
  for (const match of text.matchAll(TOKEN)) {
    if (isQuickReplyField(match[1])) found.add(match[1]);
  }
  return [...found];
}

export function findUnknownFields(body: string): string[] {
  const found = new Set<string>();
  for (const match of body.matchAll(TOKEN)) {
    if (!isQuickReplyField(match[1])) found.add(match[1]);
  }
  return [...found];
}
