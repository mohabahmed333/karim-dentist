/**
 * Which language to send a patient.
 *
 * Nothing in the schema records this — there is no language column on
 * `reservations`, `patient_profiles` or `whatsapp_conversations` — so it is
 * inferred, in order of how much it tells us:
 *
 *   1. What the patient last wrote on WhatsApp. Strongest signal by far.
 *   2. The script of their name. Weak: plenty of patients with Arabic-script
 *      names prefer to be messaged in English.
 *   3. Arabic, the default for a Cairo clinic.
 */

import type { BodyLanguage } from "./templates";

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿ]/;
const LATIN_SCRIPT = /[A-Za-z]/;

/**
 * The script a string is written in, or null when it carries no signal —
 * a bare phone number or a row of emoji says nothing about language.
 */
function scriptOf(text: string | null | undefined): BodyLanguage | null {
  if (!text?.trim()) return null;
  if (ARABIC_SCRIPT.test(text)) return "ar";
  if (LATIN_SCRIPT.test(text)) return "en";
  return null;
}

export type PickLanguageInput = {
  /** The newest inbound WhatsApp message from this patient, if there is one. */
  lastInboundBody?: string | null;
  patientName: string;
  fallback?: BodyLanguage;
};

export function pickPatientLanguage(input: PickLanguageInput): BodyLanguage {
  return (
    scriptOf(input.lastInboundBody) ??
    scriptOf(input.patientName) ??
    input.fallback ??
    "ar"
  );
}
