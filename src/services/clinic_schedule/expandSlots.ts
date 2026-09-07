/** Expand clinic hours into concrete slot start/end ISO pairs (local wall clock). */
export function expandClinicSlots(input: {
  openWeekdays: number[];
  timeWindows: string[];
  slotMinutes: number;
  horizonDays: number;
  from?: Date;
}): { startsAt: Date; endsAt: Date }[] {
  const from = input.from ?? new Date();
  const startDay = new Date(from);
  startDay.setHours(0, 0, 0, 0);
  startDay.setDate(startDay.getDate() + 1);

  const open = new Set(input.openWeekdays);
  const out: { startsAt: Date; endsAt: Date }[] = [];

  for (let d = 0; d < input.horizonDays; d += 1) {
    const day = new Date(startDay);
    day.setDate(startDay.getDate() + d);
    if (!open.has(day.getDay())) continue;

    for (const window of input.timeWindows) {
      const [startRaw, endRaw] = window.split("-");
      if (!startRaw || !endRaw) continue;
      const [sh, sm] = startRaw.split(":").map(Number);
      const [eh, em] = endRaw.split(":").map(Number);
      const cursor = new Date(day);
      cursor.setHours(sh ?? 0, sm ?? 0, 0, 0);
      const windowEnd = new Date(day);
      windowEnd.setHours(eh ?? 0, em ?? 0, 0, 0);

      while (cursor.getTime() + input.slotMinutes * 60_000 <= windowEnd.getTime()) {
        if (cursor.getTime() > from.getTime()) {
          const endsAt = new Date(cursor.getTime() + input.slotMinutes * 60_000);
          out.push({ startsAt: new Date(cursor), endsAt });
        }
        cursor.setMinutes(cursor.getMinutes() + input.slotMinutes);
      }
    }
  }
  return out;
}
