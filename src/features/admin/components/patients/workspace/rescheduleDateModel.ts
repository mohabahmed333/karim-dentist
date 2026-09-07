export type ReschedulePreset = {
  id: string;
  label: string;
  hint: string;
  date: Date;
  time?: string;
};

const CLINIC_TIMES = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
] as const;

export function clinicTimesForDay(): string[] {
  return [...CLINIC_TIMES];
}

export function buildReschedulePresets(now = new Date()): ReschedulePreset[] {
  const later = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const tomorrow = addDays(startOfDay(now), 1);
  const nextWeek = addDays(startOfDay(now), ((8 - now.getDay()) % 7) || 7);
  const nextWeekend = nextSaturday(now);
  return [
    {
      id: "today",
      label: "Today",
      hint: weekdayShort(now),
      date: startOfDay(now),
      time: nextClinicTime(now) ?? "10:00",
    },
    {
      id: "later",
      label: "Later",
      hint: timeHint(later),
      date: startOfDay(later),
      time: padTime(later),
    },
    {
      id: "tomorrow",
      label: "Tomorrow",
      hint: weekdayShort(tomorrow),
      date: tomorrow,
      time: "10:00",
    },
    {
      id: "next-week",
      label: "Next week",
      hint: weekdayShort(nextWeek),
      date: nextWeek,
      time: "10:00",
    },
    {
      id: "next-weekend",
      label: "Next weekend",
      hint: weekdayShort(nextWeekend),
      date: nextWeekend,
      time: "10:00",
    },
    {
      id: "2-weeks",
      label: "2 weeks",
      hint: dayMonth(addDays(startOfDay(now), 14)),
      date: addDays(startOfDay(now), 14),
      time: "10:00",
    },
    {
      id: "4-weeks",
      label: "4 weeks",
      hint: dayMonth(addDays(startOfDay(now), 28)),
      date: addDays(startOfDay(now), 28),
      time: "10:00",
    },
    {
      id: "8-weeks",
      label: "8 weeks",
      hint: dayMonth(addDays(startOfDay(now), 56)),
      date: addDays(startOfDay(now), 56),
      time: "10:00",
    },
  ];
}

export function monthMatrix(view: Date): Date[][] {
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const startPad = first.getDay(); // Su=0
  const daysInMonth = new Date(
    view.getFullYear(),
    view.getMonth() + 1,
    0,
  ).getDate();
  const cells: Date[] = [];
  for (let i = startPad; i > 0; i -= 1) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), 1 - i));
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(new Date(view.getFullYear(), view.getMonth(), d));
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push(new Date(view.getFullYear(), view.getMonth() + 1, next));
    next += 1;
  }
  const rows: Date[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatChipDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(2)}`;
}

export function combineDateTime(date: Date, time: string): string {
  const [h, m] = time.split(":").map((n) => Number.parseInt(n, 10));
  const next = new Date(date);
  next.setHours(h ?? 10, m ?? 0, 0, 0);
  return next.toISOString();
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function nextSaturday(from: Date) {
  const d = startOfDay(from);
  const add = (6 - d.getDay() + 7) % 7 || 7;
  return addDays(d, add);
}

function weekdayShort(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short" });
}

function dayMonth(d: Date) {
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function padTime(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function timeHint(d: Date) {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function nextClinicTime(now: Date): string | null {
  const mins = now.getHours() * 60 + now.getMinutes();
  for (const t of CLINIC_TIMES) {
    const [h, m] = t.split(":").map(Number);
    if ((h ?? 0) * 60 + (m ?? 0) > mins + 30) return t;
  }
  return null;
}
