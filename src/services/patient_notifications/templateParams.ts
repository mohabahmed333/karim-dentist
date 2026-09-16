/**
 * Turning a reservation into the exact payload `sendWhatsappMessage` wants.
 *
 * These templates are POSITIONAL — their bodies use `{{1}}`, not `{{name}}` —
 * so no parameter may carry a `parameterName`. `buildTemplateSendPayload`
 * switches to Meta's named-parameter format the moment one is present, and Meta
 * rejects the send as a parameter-format mismatch against a positional
 * template. That is why these arrays are built directly rather than through
 * `buildTemplateSendParts`, which exists for the admin UI's arbitrary templates.
 */

import type { TemplateSendInput } from "@/services/whatsapp/sendKapso";
import { formatAppointmentDateTime, formatAppointmentTime } from "./formatWhen";
import { templateFor, type BodyLanguage } from "./templates";

/** Meta's cap is 1024; well short of it keeps a long service label harmless. */
const MAX_PARAM_LENGTH = 300;

/**
 * Meta rejects a template parameter that contains a newline, a tab, or four or
 * more consecutive spaces — and rejects an empty one outright. A patient name
 * pasted from a booking form is the usual source of all four.
 *
 * Distinct from `sanitizeWhatsappBody`, which strips provider noise out of
 * inbound text. This one is about what Meta will accept on the way out.
 */
export function sanitizeTemplateParam(value: string | null | undefined): string {
  const collapsed = String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!collapsed) return "-";
  return collapsed.length > MAX_PARAM_LENGTH
    ? collapsed.slice(0, MAX_PARAM_LENGTH - 1).trimEnd() + "…"
    : collapsed;
}

function body(...values: string[]): TemplateSendInput["body"] {
  return values.map((text) => ({ type: "text" as const, text }));
}

export type ConfirmationInput = {
  patientName: string;
  clinicName: string;
  startsAt: string;
  serviceLabel: string;
  language: BodyLanguage;
};

/**
 * "Hi {{1}}, your appointment at {{2}} is confirmed for {{3}}. Service: {{4}}."
 * — {{2}} is the place and {{3}} the full date and time.
 */
export function buildConfirmationTemplate(
  input: ConfirmationInput,
): TemplateSendInput {
  const tpl = templateFor("confirmation", input.language);
  return {
    name: tpl.name,
    language: tpl.language,
    body: body(
      sanitizeTemplateParam(input.patientName),
      sanitizeTemplateParam(input.clinicName),
      sanitizeTemplateParam(
        formatAppointmentDateTime(input.startsAt, tpl.bodyLanguage),
      ),
      sanitizeTemplateParam(input.serviceLabel),
    ),
  };
}

export type ReminderInput = {
  patientName: string;
  clinicName: string;
  startsAt: string;
  language: BodyLanguage;
};

/**
 * "Reminder: {{1}}, you have an appointment at {{2}} tomorrow at {{3}}."
 *
 * {{3}} is the time alone — the approved body supplies the day itself. See
 * `isTomorrowIn`, which the dispatcher uses to make sure "tomorrow" is true
 * before this is ever sent.
 */
export function buildReminderTemplate(input: ReminderInput): TemplateSendInput {
  const tpl = templateFor("reminder_24h", input.language);
  return {
    name: tpl.name,
    language: tpl.language,
    body: body(
      sanitizeTemplateParam(input.patientName),
      sanitizeTemplateParam(input.clinicName),
      sanitizeTemplateParam(formatAppointmentTime(input.startsAt, tpl.bodyLanguage)),
    ),
  };
}

export type BillingPaymentRequestInput = {
  patientName: string;
  /** Already formatted for the patient's language, e.g. "EGP 1,200". */
  amountLabel: string;
  description: string;
  /** InstaPay handle and/or wallet number, joined for display. */
  destination: string;
  language: BodyLanguage;
};

/**
 * "Hi {{1}}, your bill is {{2}}. Transfer to: {{3}}. Send us a photo of the
 * receipt here and we'll confirm we received it."
 *
 * {{3}} is the whole point: a bill the patient cannot act on without asking
 * where to send the money is a round trip the clinic has to answer by hand.
 */
export function buildBillingPaymentRequestTemplate(
  input: BillingPaymentRequestInput,
): TemplateSendInput {
  const tpl = templateFor("billing_payment_request", input.language);
  return {
    name: tpl.name,
    language: tpl.language,
    body: body(
      sanitizeTemplateParam(input.patientName),
      sanitizeTemplateParam(`${input.amountLabel} (${input.description})`),
      sanitizeTemplateParam(input.destination),
    ),
  };
}

/**
 * The template for one outbox row, or null when this clinic has none approved.
 *
 * Only `confirmation` and `reminder_24h` have approved templates today. A
 * cancellation or a reschedule notice has nothing to send it with, and Meta
 * will not accept free text outside the 24h window — so the dispatcher records
 * `no_approved_template` and stays quiet rather than failing in a way that
 * looks like a bug. Submitting those templates is all that is needed to switch
 * them on: add them to PATIENT_TEMPLATES and extend this switch.
 */
export function buildTemplateForKind(
  kind: string,
  input: ConfirmationInput,
  /** Row payload, for kinds whose text is not derivable from a reservation. */
  payload?: Record<string, unknown> | null,
): TemplateSendInput | null {
  switch (kind) {
    case "confirmation":
      return buildConfirmationTemplate(input);
    case "reminder_24h":
      return buildReminderTemplate(input);
    case "billing_payment_request": {
      const amountLabel = String(payload?.amount_label ?? "").trim();
      const destination = String(payload?.destination ?? "").trim();
      // Without both, the message would tell the patient to transfer to
      // nothing. Better to stay queued and visible in the outbox.
      if (!amountLabel || !destination) return null;
      try {
        return buildBillingPaymentRequestTemplate({
          patientName: input.patientName,
          amountLabel,
          description: String(payload?.description ?? "").trim() || "-",
          destination,
          language: input.language,
        });
      } catch {
        // No approved template for this kind yet; the dispatcher records
        // `no_approved_template` and stays quiet, as for every other kind.
        return null;
      }
    }
    default:
      return null;
  }
}
