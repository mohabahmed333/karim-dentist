import { CLINIC_TIME_ZONE } from "@/services/patient_notifications/formatWhen";

/**
 * The clinic's UTC offset, in minutes, at a given instant.
 *
 * Never hardcoded: Egypt reintroduced daylight saving in 2023, so the clinic
 * is UTC+2 in winter and UTC+3 in summer (see the same note in
 * `patient_notifications/formatWhen.ts`). Read via `Intl` so a change to the
 * rule needs no code change here either.
 */
function cairoOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIME_ZONE,
    timeZoneName: "shortOffset",
  }).formatToParts(at);
  const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+2";
  const match = raw.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 120;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

/**
 * The UTC instants bounding one clinic-local calendar day, `[start, end)`.
 *
 * Used to turn a `YYYY-MM-DD` a tool receives (staff's or the model's idea of
 * "that day") into the UTC range `starts_at` is actually stored in — the same
 * mistake `formatWhen.ts` warns about, done correctly once here instead of at
 * every call site.
 */
export function cairoDayRangeUtc(dateStr: string): { startUtc: string; endUtc: string } {
  const [y, m, d] = dateStr.split("-").map(Number);
  const naiveUtcMidnight = Date.UTC(y!, m! - 1, d!);
  const offsetMin = cairoOffsetMinutes(new Date(naiveUtcMidnight));
  const start = new Date(naiveUtcMidnight - offsetMin * 60_000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { startUtc: start.toISOString(), endUtc: end.toISOString() };
}
