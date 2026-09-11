const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export type ClinicHoursInput = {
  open_weekdays: number[];
  time_windows: string[];
  timezone?: string | null;
};

/** Valid weekdays (0 = Sunday), de-duplicated and grouped into runs of consecutive days. */
export function collapseWeekdays(weekdays: number[]): number[][] {
  const days = [...new Set(weekdays)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && day === last[last.length - 1] + 1) last.push(day);
    else groups.push([day]);
  }
  return groups;
}

/**
 * Render opening hours for the auto-responder's prompt.
 *
 * Without this the model has no hours to quote, and its "never invent" rule
 * makes it hand off every time someone asks when the clinic opens — which is
 * the most common question the front desk gets.
 *
 * Consecutive open days collapse into a range ("Sunday to Thursday") because
 * that is how a person would say it, and how the patient expects to read it.
 */
export function formatClinicHours(hours: ClinicHoursInput | null): string {
  if (!hours || !hours.open_weekdays?.length || !hours.time_windows?.length) {
    return "Opening hours: (not configured — do not state opening hours)";
  }

  const groups = collapseWeekdays(hours.open_weekdays);
  if (!groups.length) {
    return "Opening hours: (not configured — do not state opening hours)";
  }

  const dayText = groups
    .map((group) =>
      group.length === 1
        ? DAY_NAMES[group[0]]
        : `${DAY_NAMES[group[0]]} to ${DAY_NAMES[group[group.length - 1]]}`,
    )
    .join(", ");

  const windows = hours.time_windows
    .map((w) => w.replace("-", " to "))
    .join(" and ");

  const tz = hours.timezone ? ` (${hours.timezone})` : "";
  return `Opening hours: ${dayText}, ${windows}${tz}. The clinic is closed on any day not listed.`;
}
