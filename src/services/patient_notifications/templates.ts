/**
 * The WhatsApp templates this clinic actually has approved in Meta.
 *
 * Meta template names are immutable once submitted, and these were submitted
 * with two problems we have to live with rather than fix:
 *
 *   1. `appoinment_en` / `appoinment_ar` are misspelled. Those are the real
 *      registered names.
 *   2. The reminder suffixes are SWAPPED. The approved body of `reminder_en` is
 *      ARABIC; the approved body of `reminder_ar` is ENGLISH. The `_ar` / `_en`
 *      suffix therefore means nothing — `bodyLanguage` is the only field
 *      anything may branch on.
 *
 * All four are also registered under language `en_US` regardless of what
 * language their body is written in, so `language` is a transport detail that
 * Meta matches against its own records — never a way to choose a translation.
 *
 * A template that gets rejected, renamed or re-approved is a one-line edit in
 * this file and nowhere else.
 */

export type TemplateKind = "confirmation" | "reminder_24h";
export type BodyLanguage = "ar" | "en";

/** What Meta has these registered as. Not the language of the text. */
export const WHATSAPP_TEMPLATE_LANGUAGE = "en_US" as const;

export type PatientTemplate = {
  kind: TemplateKind;
  /** The immutable name registered with Meta. */
  name: string;
  /** The language the approved body is actually written in. */
  bodyLanguage: BodyLanguage;
  language: typeof WHATSAPP_TEMPLATE_LANGUAGE;
  /** How many {{n}} placeholders the approved body contains. */
  bodyParams: number;
};

export const PATIENT_TEMPLATES: readonly PatientTemplate[] = [
  // "Hi {{1}}, your appointment at {{2}} is confirmed for {{3}}. Service: {{4}}."
  {
    kind: "confirmation",
    name: "appoinment_en",
    bodyLanguage: "en",
    language: WHATSAPP_TEMPLATE_LANGUAGE,
    bodyParams: 4,
  },
  // "أهلاً {{1}}، تم تأكيد حجزك في {{2}} يوم {{3}}. الخدمة: {{4}}."
  {
    kind: "confirmation",
    name: "appoinment_ar",
    bodyLanguage: "ar",
    language: WHATSAPP_TEMPLATE_LANGUAGE,
    bodyParams: 4,
  },
  // Named `_en`, but the approved body is Arabic:
  // "تذكير: {{1}}، عندك ميعاد في {{2}} بكرة الساعة {{3}}. في انتظارك."
  {
    kind: "reminder_24h",
    name: "reminder_en",
    bodyLanguage: "ar",
    language: WHATSAPP_TEMPLATE_LANGUAGE,
    bodyParams: 3,
  },
  // Named `_ar`, but the approved body is English:
  // "Reminder: {{1}}, you have an appointment at {{2}} tomorrow at {{3}}."
  {
    kind: "reminder_24h",
    name: "reminder_ar",
    bodyLanguage: "en",
    language: WHATSAPP_TEMPLATE_LANGUAGE,
    bodyParams: 3,
  },
] as const;

/**
 * The approved template whose body is written in `language`.
 *
 * Throws rather than falling back to another template: sending a patient the
 * wrong language is recoverable, but sending them a confirmation when we meant
 * a reminder is not.
 */
export function templateFor(
  kind: TemplateKind,
  language: BodyLanguage,
): PatientTemplate {
  const found = PATIENT_TEMPLATES.find(
    (t) => t.kind === kind && t.bodyLanguage === language,
  );
  if (!found) {
    throw new Error(
      `No approved template for ${kind} in ${language}. ` +
        `Submit one in Meta Business Manager and add it to PATIENT_TEMPLATES.`,
    );
  }
  return found;
}
