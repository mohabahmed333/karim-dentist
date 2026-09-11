import {
  CLINIC_TIME_ZONE,
  formatAppointmentDateTime,
} from "@/services/patient_notifications/formatWhen";
import {
  collapseWeekdays,
  type ClinicHoursInput,
} from "@/services/whatsapp_ai/formatClinicHours";
import type { QuickReplyValues } from "./quickReplyFields";

export type QuickReplyLanguage = "ar" | "en";

const DAY_NAMES: Record<QuickReplyLanguage, readonly string[]> = {
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
};

/**
 * Opening hours as a patient reads them. `formatClinicHours` writes for the
 * model's prompt ("Opening hours: … The clinic is closed on any day not
 * listed."), which is not something to paste into a message.
 */
export function formatHoursForPatient(
  hours: ClinicHoursInput | null,
  lang: QuickReplyLanguage,
): string | null {
  if (!hours?.time_windows?.length) return null;
  const groups = collapseWeekdays(hours.open_weekdays ?? []);
  if (!groups.length) return null;
  const names = DAY_NAMES[lang];
  const to = lang === "ar" ? " إلى " : " to ";
  const comma = lang === "ar" ? "، " : ", ";
  const days = groups
    .map((group) =>
      group.length === 1
        ? names[group[0]]
        : `${names[group[0]]}${to}${names[group[group.length - 1]]}`,
    )
    .join(comma);
  const windows = hours.time_windows
    .map((window) => window.replace("-", to))
    .join(lang === "ar" ? " و" : " and ");
  return `${days}${comma}${windows}`;
}

export type QuickReplyValueInput = {
  lang: QuickReplyLanguage;
  contactName: string | null;
  patientDisplayName: string | null;
  /** Upcoming reservations, soonest first. */
  reservations: {
    patient_name: string | null;
    service_label: string | null;
    starts_at: string;
  }[];
  clinic: { phone: string; address: string };
  hours: ClinicHoursInput | null;
  location: { latitude: number; longitude: number };
};

/**
 * Every value a quick reply can use for one conversation. A field is left out
 * rather than guessed when the data is not there — the composer then keeps the
 * `{{field}}` marker and blocks the send.
 */
export function buildQuickReplyValues(input: QuickReplyValueInput): QuickReplyValues {
  const next = input.reservations[0] ?? null;
  const values: QuickReplyValues = {
    clinic_address: input.clinic.address,
    clinic_phone: input.clinic.phone,
    // Same link shape as locationMapsUrl in the chat's location card.
    maps_link: `https://www.google.com/maps?q=${input.location.latitude},${input.location.longitude}`,
  };

  const fullName =
    [input.patientDisplayName, next?.patient_name, input.contactName]
      .map((candidate) => candidate?.trim() ?? "")
      .find(Boolean) ?? "";
  const firstName = fullName.split(/\s+/)[0];
  if (firstName) values.name = firstName;

  if (next) {
    values.next_appointment = formatAppointmentDateTime(
      next.starts_at,
      input.lang,
      input.hours?.timezone || CLINIC_TIME_ZONE,
    );
    const service = next.service_label?.trim();
    if (service) values.appointment_service = service;
  }

  const hours = formatHoursForPatient(input.hours, input.lang);
  if (hours) values.clinic_hours = hours;

  return values;
}
