/**
 * schema.org OpeningHoursSpecification, built from the clinic_hours table —
 * not the free-text `site_settings.contact_hours` string, which is display
 * copy only and has drifted out of date (it still says "AST", not Egypt's
 * timezone). clinic_hours is structured and publicly readable.
 */

const SCHEMA_DAYS = [
  "https://schema.org/Sunday",
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
  "https://schema.org/Saturday",
] as const;

export type OpeningHoursSpec = {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
};

export type ClinicHoursInput = {
  open_weekdays: number[];
  time_windows: string[];
  timezone: string;
} | null | undefined;

const TIME_WINDOW = /^(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseTimeWindow(
  window: string,
): { opens: string; closes: string } | null {
  const match = TIME_WINDOW.exec(window.trim());
  if (!match) return null;
  const [, oh, om, ch, cm] = match;
  const openHour = Number(oh);
  const closeHour = Number(ch);
  if (openHour > 23 || closeHour > 23) return null;
  if (Number(om) > 59 || Number(cm) > 59) return null;
  return {
    opens: `${pad2(openHour)}:${om}`,
    closes: `${pad2(closeHour)}:${cm}`,
  };
}

function normalizedDayNames(openWeekdays: number[]): string[] {
  const unique = Array.from(new Set(openWeekdays)).filter(
    (day) => Number.isInteger(day) && day >= 0 && day <= 6,
  );
  unique.sort((a, b) => a - b);
  return unique.map((day) => SCHEMA_DAYS[day]);
}

/**
 * One spec per valid time window, each listing every open weekday.
 * Malformed windows are skipped rather than guessed at; if nothing valid
 * remains, returns null so the caller can omit the key entirely instead of
 * publishing wrong or partial structured data.
 */
export function openingHoursSpecification(
  hours: ClinicHoursInput,
): OpeningHoursSpec[] | null {
  if (!hours) return null;
  const dayOfWeek = normalizedDayNames(hours.open_weekdays ?? []);
  if (dayOfWeek.length === 0) return null;

  const specs: OpeningHoursSpec[] = [];
  for (const window of hours.time_windows ?? []) {
    const parsed = parseTimeWindow(window);
    if (!parsed) continue;
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek,
      opens: parsed.opens,
      closes: parsed.closes,
    });
  }
  return specs.length > 0 ? specs : null;
}

const SHORT_DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "Sun–Thu" for a contiguous run, "Sun, Tue, Fri" otherwise. */
function formatDayRange(days: number[]): string {
  if (days.length === 0) return "";
  const isContiguous = days.every(
    (day, index) => index === 0 || day === days[index - 1] + 1,
  );
  if (isContiguous && days.length > 1) {
    return `${SHORT_DAY_NAMES[days[0]]}–${SHORT_DAY_NAMES[days[days.length - 1]]}`;
  }
  return days.map((day) => SHORT_DAY_NAMES[day]).join(", ");
}

/**
 * Human-readable hours for llms.txt / a plain-text summary, built from the
 * same structured source as openingHoursSpecification — never the stale
 * free-text contact_hours field.
 */
export function formatOpeningHoursText(hours: ClinicHoursInput): string | null {
  if (!hours) return null;
  const days = Array.from(new Set(hours.open_weekdays ?? []))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
  if (days.length === 0) return null;

  const windows = (hours.time_windows ?? [])
    .map((window) => parseTimeWindow(window))
    .filter((w): w is { opens: string; closes: string } => w !== null)
    .map((w) => `${w.opens}–${w.closes}`);
  if (windows.length === 0) return null;

  return `${formatDayRange(days)} ${windows.join(", ")} (${hours.timezone})`;
}
