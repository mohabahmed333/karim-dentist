import { z } from "zod";

const WINDOW_RE = /^\d{2}:\d{2}-\d{2}:\d{2}$/;

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function parseWindowRange(
  window: string,
): { start: number; end: number } | null {
  if (!WINDOW_RE.test(window)) return null;
  const [startRaw, endRaw] = window.split("-");
  if (!startRaw || !endRaw) return null;
  return { start: timeToMinutes(startRaw), end: timeToMinutes(endRaw) };
}

function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && b.start < a.end;
}

/** Error message if windows are invalid; null when OK. */
export function timeWindowsIssue(windows: string[]): string | null {
  const ranges: { start: number; end: number }[] = [];
  for (let i = 0; i < windows.length; i += 1) {
    const range = parseWindowRange(windows[i] ?? "");
    if (!range) return `Window ${i + 1} must look like 10:00-13:00`;
    if (range.start >= range.end) {
      return `Window ${i + 1}: "To" must be after "From"`;
    }
    for (const other of ranges) {
      if (rangesOverlap(range, other)) {
        return "Time windows overlap — each From/To range must be separate";
      }
    }
    ranges.push(range);
  }
  return null;
}

/** Pick a default window that does not overlap existing ones. */
export function suggestNonOverlappingWindow(existing: string[]): string {
  const candidates = [
    "10:00-13:00",
    "14:00-18:00",
    "09:00-12:00",
    "18:00-20:00",
    "08:00-10:00",
    "16:00-18:00",
    "12:00-14:00",
  ];
  for (const candidate of candidates) {
    if (!timeWindowsIssue([...existing, candidate])) return candidate;
  }
  return "20:00-22:00";
}

export const clinicHoursUpsertSchema = z
  .object({
    open_weekdays: z
      .array(z.number().int().min(0).max(6))
      .min(1, "Pick at least one open day"),
    time_windows: z
      .array(z.string().regex(WINDOW_RE))
      .min(1, "Add at least one time window"),
    slot_minutes: z.union([
      z.literal(15),
      z.literal(30),
      z.literal(45),
      z.literal(60),
      z.literal(90),
      z.literal(120),
    ]),
    horizon_days: z.number().int().min(7).max(60).default(21),
  })
  .superRefine((data, ctx) => {
    const issue = timeWindowsIssue(data.time_windows);
    if (issue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue,
        path: ["time_windows"],
      });
    }
  });

export type ClinicHoursUpsertValues = z.infer<typeof clinicHoursUpsertSchema>;
