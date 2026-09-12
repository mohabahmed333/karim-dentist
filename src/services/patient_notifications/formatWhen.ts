/**
 * Appointment times as a patient reads them, in the clinic's timezone.
 *
 * Everything here goes through `Intl.DateTimeFormat` with an explicit
 * `timeZone`. Never compute Cairo time by adding a fixed offset: Egypt
 * reintroduced daylight saving in 2023, so the clinic is UTC+2 in winter and
 * UTC+3 in summer, and a hardcoded offset is wrong for half the year.
 */

import type { BodyLanguage } from "./templates";

export const CLINIC_TIME_ZONE = "Africa/Cairo";

/**
 * `ar-EG` renders digits as Arabic-Indic (١٠:٣٠) by default. The clinic reads
 * those fine, but their exact shape drifts between ICU versions, and Meta
 * template parameters are compared as plain strings. `-u-nu-latn` pins Western
 * digits in both languages.
 */
function localeFor(language: BodyLanguage): string {
  return language === "ar" ? "ar-EG-u-nu-latn" : "en-GB";
}

/** "Wednesday 15 July 2026 at 10:00 am" — the confirmation's `{{3}}`. */
export function formatAppointmentDateTime(
  startsAt: string | Date,
  language: BodyLanguage,
  timeZone: string = CLINIC_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(startsAt));
}

/**
 * "10:00 am" — the reminder's `{{3}}`.
 *
 * The approved reminder body already says "tomorrow" / "بكرة", so this must be
 * the time alone. A full date here reads as "tomorrow at Wednesday 15 July".
 */
export function formatAppointmentTime(
  startsAt: string | Date,
  language: BodyLanguage,
  timeZone: string = CLINIC_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(startsAt));
}

/**
 * WhatsApp refuses a reply button whose title runs past this, so a label that
 * overruns costs the whole message, not just the wording.
 */
export const BUTTON_TITLE_LIMIT = 20;

/**
 * A slot as a reply-button title: "Sun 10:30 am" / "الأحد 10:30 ص".
 *
 * Deliberately the shortest label that still names a day and a time — someone
 * choosing between three buttons needs both, and has no other context.
 */
export function formatSlotButtonLabel(
  startsAt: string | Date,
  language: BodyLanguage,
  timeZone: string = CLINIC_TIME_ZONE,
): string {
  const label = new Intl.DateTimeFormat(localeFor(language), {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(new Date(startsAt))
    .replace(/\s+/g, " ")
    .trim();
  // A safety net, not the plan: every locale here fits comfortably, but an ICU
  // change that lengthened a weekday would otherwise fail the send outright.
  return label.length <= BUTTON_TITLE_LIMIT ? label : label.slice(0, BUTTON_TITLE_LIMIT).trim();
}

/** The calendar date in `timeZone`, as `YYYY-MM-DD`. */
function localDay(at: Date, timeZone: string): string {
  // `en-CA` is ISO-ordered, which makes the parts directly comparable.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/**
 * Is `startsAt` on the day after `now`, judged in the clinic's timezone?
 *
 * The reminder template hardcodes the word "tomorrow", so a reminder that slips
 * — deferred past midnight by quiet hours, or queued with a different lead time
 * — would state the wrong day with full confidence. The dispatcher checks this
 * immediately before sending and skips rather than lies.
 */
export function isTomorrowIn(
  startsAt: string | Date,
  now: Date,
  timeZone: string = CLINIC_TIME_ZONE,
): boolean {
  const today = localDay(now, timeZone);
  // Adding 24h then re-reading the local day is DST-safe here: a ±1h shift can
  // never move a midday reading onto a different calendar date.
  const tomorrow = localDay(new Date(now.getTime() + 24 * 60 * 60 * 1000), timeZone);
  const appointmentDay = localDay(new Date(startsAt), timeZone);
  return appointmentDay !== today && appointmentDay === tomorrow;
}
