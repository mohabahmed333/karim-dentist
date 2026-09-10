/**
 * When a notification may be sent, in the clinic's local time.
 *
 * All reasoning goes through Intl with an explicit `timeZone`. Egypt has
 * observed DST since 2023, so Cairo is UTC+2 in winter and UTC+3 in summer —
 * arithmetic on a fixed offset is wrong for half the year, and this is code
 * whose whole purpose is to decide whether it is 3am for the patient.
 */

export type QuietHours = {
  /** Local hour quiet time begins, inclusive. */
  start: number;
  /** Local hour quiet time ends, exclusive. */
  end: number;
  timeZone: string;
};

type LocalParts = { hour: number; minute: number; second: number };

function localParts(at: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  // `hour12: false` renders midnight as 24 in some ICU versions.
  return { hour: get("hour") % 24, minute: get("minute"), second: get("second") };
}

export function localHourIn(at: Date, timeZone: string): number {
  return localParts(at, timeZone).hour;
}

/** Is `hour` inside the quiet window? The window normally crosses midnight. */
export function isQuietHour(hour: number, start: number, end: number): boolean {
  if (start === end) return false; // degenerate: quiet hours disabled
  return start > end
    ? hour >= start || hour < end // 22 -> 9, the usual case
    : hour >= start && hour < end;
}

/**
 * The first moment at or after `at` that is not quiet time.
 *
 * Deferring rather than dropping is deliberate: a reminder held from 22:30 to
 * 09:00 is still a useful reminder, whereas a patient woken at 3am is a
 * complaint. Callers that must not slide (a reminder whose template says
 * "tomorrow") re-check truthfulness separately.
 */
export function nextSendableAt(at: Date, quiet: QuietHours): Date {
  if (!isQuietHour(localHourIn(at, quiet.timeZone), quiet.start, quiet.end)) {
    return at;
  }
  // Walk forward an hour at a time and let Intl re-read the local hour, so a
  // DST transition inside the quiet window is handled by the calendar rather
  // than by us. Bounded well above 24 to terminate whatever the zone does.
  let cursor = at;
  for (let step = 0; step < 48; step += 1) {
    cursor = new Date(cursor.getTime() + 3_600_000);
    const parts = localParts(cursor, quiet.timeZone);
    if (parts.hour === quiet.end) {
      // Land on the top of the opening hour rather than keeping the original
      // minutes, so the morning batch goes out at 09:00, not 09:37.
      return new Date(cursor.getTime() - (parts.minute * 60 + parts.second) * 1000);
    }
  }
  return at;
}
