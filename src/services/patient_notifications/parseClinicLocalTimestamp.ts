/**
 * Read a date and time the way an Egyptian receipt prints it.
 *
 * Two things make `Date.parse` the wrong tool here, and both of them put a
 * wrong date on somebody's payment:
 *
 * 1. **It resolves a zone-less string against the server's zone.** A transfer
 *    made at 17:30 in Cairo was stored as 17:30 UTC — three hours later than it
 *    happened, which reads as a payment from the future and sends every fresh
 *    receipt to manual review. Worse, it is inconsistent about *which* zone: a
 *    bare ISO date is read as UTC while a bare ISO date-time is read as local,
 *    so one receipt produced three different instants depending on where the
 *    code ran.
 * 2. **It assumes American ordering.** Egypt writes the day first. `13/09/2026`
 *    is simply invalid to it, and `05/09/2026` — the fifth of September —
 *    parses happily as the ninth of May. A four-month error, reported as a
 *    success.
 *
 * So the grammar is explicit. Nothing here consults the server's clock or zone:
 * the wall clock is read from the text, then anchored to the clinic's zone via
 * `Intl`, which knows that Egypt reintroduced daylight saving in 2023.
 *
 * Everything doubtful returns null. A null costs one trip to the staff queue; a
 * guess puts a date nobody checked on a payment.
 */

import { foldArabicDigits } from "@/lib/text/arabicDigits";
import { CLINIC_TIME_ZONE, clinicOffsetMinutes } from "./formatWhen";

export type ParseClinicTimestampOptions = {
  timeZone?: string;
  /**
   * Whether a zone written into the text may be believed.
   *
   * True for a timestamp we generated. False for one a model read off a
   * receipt image: a banking app prints the phone's own clock and never UTC,
   * so any "Z" in the extraction was appended by the model to a local time it
   * never converted — the exact three-hour error this module exists to stop.
   */
  trustNamedZone?: boolean;
};

/** Direction marks and zero-width junk, which an RTL screenshot is full of. */
const INVISIBLE = /[​-‏‪-‮⁦-⁩؜﻿ـ]/g;
/** Non-breaking and typographic spaces, which sit between a clock and its "م". */
const ODD_SPACE = /[   -   　]/g;
/** Arabic diacritics, occasionally rendered over a month name. */
const HARAKAT = /[ً-ْٰ]/g;

/** No banking app printed a year outside this range. */
const EARLIEST_YEAR = 2000;
const LATEST_YEAR = 2099;

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10, october: 10,
  nov: 11, november: 11, dec: 12, december: 12,
  // As Egypt names them. Spelling of the hamza and the final letter varies
  // between apps, so the lookup key is folded (see `monthKey`) before matching.
  ينابر: 1, يناير: 1, فبراير: 2, مارس: 3, ابريل: 4, مايو: 5,
  يونيو: 6, يونيه: 6, يوليو: 7, يوليه: 7, اغسطس: 8, سبتمبر: 9,
  اكتوبر: 10, نوفمبر: 11, ديسمبر: 12,
};

/** أ/إ/آ → ا and ة → ه, so "أغسطس" and "اغسطس" are one key. */
function monthKey(word: string): string {
  return word
    .toLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\.$/, "");
}

function monthFromWord(word: string): number | null {
  return MONTHS[monthKey(word)] ?? null;
}

function normalise(raw: string): string {
  return foldArabicDigits(raw)
    .replace(INVISIBLE, "")
    .replace(HARAKAT, "")
    .replace(ODD_SPACE, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

function isRealDate(year: number, month: number, day: number): boolean {
  if (year < EARLIEST_YEAR || year > LATEST_YEAR) return false;
  if (month < 1 || month > 12) return false;
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const limit = month === 2 && leap ? 29 : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= limit;
}

/** "26" is 2026. A four-digit year is taken as written. */
function expandYear(raw: string): number {
  const n = Number(raw);
  return raw.length <= 2 ? 2000 + n : n;
}

type Wall = {
  year: number; month: number; day: number;
  hour: number; minute: number; second: number;
  /** Minutes east of UTC when the text named a zone itself. */
  namedOffset: number | null;
};

const ISO = new RegExp(
  "^(\\d{4})-(\\d{2})-(\\d{2})" +
    "(?:[T ](\\d{1,2}):(\\d{2})(?::(\\d{2}))?(?:\\.\\d+)?)?" +
    "\\s*(Z|[+-]\\d{2}:?\\d{2}|[+-]\\d{2})?$",
  "i",
);

/** "14:41", "2:41 PM", "٢:٤١ م" — the meridiem may be Arabic or absent. */
const TIME = /(?:^|[^\d:])(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.|ص|م)?(?![\d:])/i;

/** A trailing zone on a non-ISO string: "... 14:41 GMT+2", "... 14:41 UTC". */
const TRAILING_ZONE = /\b(?:GMT|UTC)\s*([+-]\d{1,2}(?::?\d{2})?)?$/i;

/** Bounded so a reference number like "FT24/09/13" is not read as a date. */
const NUMERIC_DATE = /(?<![\dA-Za-z])(\d{1,4})[/.\-](\d{1,2})[/.\-](\d{2,4})(?![\dA-Za-z])/;
/** "13 Sep 2026", "13 سبتمبر 2026". */
const DAY_MONTH_YEAR = /(?<![\dA-Za-z])(\d{1,2})\s+([A-Za-z؀-ۿ]+)\.?,?\s+(\d{4})(?!\d)/;
/** "Sep 13, 2026". */
const MONTH_DAY_YEAR = /([A-Za-z؀-ۿ]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})(?!\d)/i;

function zoneOffsetMinutes(raw: string): number | null {
  const text = raw.trim();
  if (!text || /^z$/i.test(text)) return 0;
  const match = text.match(/^([+-])(\d{1,2}):?(\d{2})?$/);
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  if (hours > 14 || minutes > 59) return null;
  return sign * (hours * 60 + minutes);
}

/**
 * Apply a meridiem to a 12-hour clock.
 *
 * Midnight and noon are where this is usually got wrong: 12:30 AM is 00:30 and
 * 12:30 PM is 12:30, neither of which falls out of adding twelve. A meridiem
 * beside an hour past 12 is a printing quirk, not a contradiction worth
 * refusing — some apps write "14:41 م" — so the 24-hour clock simply wins.
 */
function applyMeridiem(hour: number, meridiem: string | undefined): number {
  if (!meridiem || hour > 12) return hour;
  const afternoon = /^(pm|p\.m\.|م)$/i.test(meridiem);
  if (afternoon) return hour === 12 ? 12 : hour + 12;
  return hour === 12 ? 0 : hour;
}

function readWallClock(text: string): Wall | null {
  const iso = text.match(ISO);
  if (iso) {
    const [, y, mo, d, h, mi, s, zone] = iso;
    if (!isRealDate(Number(y), Number(mo), Number(d))) return null;
    const hour = Number(h ?? 0);
    const minute = Number(mi ?? 0);
    const second = Number(s ?? 0);
    if (hour > 23 || minute > 59 || second > 59) return null;
    return {
      year: Number(y), month: Number(mo), day: Number(d),
      hour, minute, second,
      namedOffset: zone ? zoneOffsetMinutes(zone) : null,
    };
  }

  // A clock may sit either side of the date ("٢:٤١ م ١٣/٠٩/٢٠٢٦"), so it is
  // lifted out first and the date read from whatever is left.
  let namedOffset: number | null = null;
  let rest = text;

  const zoned = rest.match(TRAILING_ZONE);
  if (zoned) {
    namedOffset = zoned[1] ? zoneOffsetMinutes(zoned[1]) : 0;
    rest = rest.slice(0, zoned.index).trim();
  } else if (/\d\s*Z$/.test(rest)) {
    namedOffset = 0;
    rest = rest.replace(/\s*Z$/, "");
  }

  let hour = 0;
  let minute = 0;
  let second = 0;
  const time = rest.match(TIME);
  if (time) {
    hour = applyMeridiem(Number(time[1]), time[4]);
    minute = Number(time[2]);
    second = Number(time[3] ?? 0);
    if (hour > 23 || minute > 59 || second > 59) return null;
    rest = (rest.slice(0, time.index) + " " + rest.slice(time.index! + time[0].length)).trim();
  }

  const date = readDate(rest);
  if (!date) return null;
  return { ...date, hour, minute, second, namedOffset };
}

function readDate(text: string): { year: number; month: number; day: number } | null {
  const numeric = text.match(NUMERIC_DATE);
  if (numeric) {
    const [, a, b, c] = numeric;
    // Year first ("2026/09/13") is unambiguous; otherwise the year is last.
    const parts =
      a.length === 4
        ? { year: Number(a), first: Number(b), second: Number(c) }
        : { year: expandYear(c), first: Number(a), second: Number(b) };
    const { year, first, second } = parts;

    let month: number;
    let day: number;
    if (a.length === 4) {
      month = first;
      day = second;
    } else if (first > 12 && second <= 12) {
      day = first;
      month = second;
    } else if (second > 12 && first <= 12) {
      // An app formatted for the United States. Only read this way when
      // day-first is impossible.
      month = first;
      day = second;
    } else if (first <= 12 && second <= 12) {
      // Genuinely ambiguous, so the clinic's own convention decides: Egypt
      // writes the day first.
      day = first;
      month = second;
    } else {
      return null;
    }
    return isRealDate(year, month, day) ? { year, month, day } : null;
  }

  const dmy = text.match(DAY_MONTH_YEAR);
  if (dmy) {
    const month = monthFromWord(dmy[2]);
    const day = Number(dmy[1]);
    const year = Number(dmy[3]);
    if (month && isRealDate(year, month, day)) return { year, month, day };
    return null;
  }

  const mdy = text.match(MONTH_DAY_YEAR);
  if (mdy) {
    const month = monthFromWord(mdy[1]);
    const day = Number(mdy[2]);
    const year = Number(mdy[3]);
    if (month && isRealDate(year, month, day)) return { year, month, day };
  }
  return null;
}

/**
 * A receipt's printed date and time, as an ISO instant — or null.
 *
 * A year is required: a receipt reading "13 Sep 11:45" says nothing about which
 * year, and `Date.parse` answered that question with 2001.
 */
export function parseClinicLocalTimestamp(
  raw: string,
  options: ParseClinicTimestampOptions = {},
): string | null {
  const { timeZone = CLINIC_TIME_ZONE, trustNamedZone = true } = options;

  const text = normalise(raw);
  if (!text) return null;

  const wall = readWallClock(text);
  if (!wall) return null;

  const naiveUtc = Date.UTC(
    wall.year,
    wall.month - 1,
    wall.day,
    wall.hour,
    wall.minute,
    wall.second,
  );

  if (trustNamedZone && wall.namedOffset !== null) {
    return new Date(naiveUtc - wall.namedOffset * 60_000).toISOString();
  }

  // The offset is looked up at the naive instant, which can sit an hour out on
  // the single night Egypt changes over — immaterial against the tolerances
  // this feeds.
  const offset = clinicOffsetMinutes(new Date(naiveUtc), timeZone);
  return new Date(naiveUtc - offset * 60_000).toISOString();
}
