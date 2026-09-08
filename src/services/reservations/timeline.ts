import type { Reservation, ReservationStatus } from "./types";
import type { PatientGroup } from "./patientHistory";

export type TimelineStatusFilter = "all" | ReservationStatus;

export type TimelineDay = {
  date: Date;
  iso: string;
  weekday: string;
  dayNum: number;
  isWeekend: boolean;
  isToday: boolean;
};

export type TimelineRow = {
  id: string;
  label: string;
  subtitle: string;
  reservation: Reservation;
  startCol: number;
  endCol: number;
};

export type PatientTimelineVisit = {
  reservation: Reservation;
  startCol: number;
  endCol: number;
  lane: number;
};

export type PatientTimelineRow = {
  patientKey: string;
  label: string;
  subtitle: string;
  phone: string;
  email: string | null;
  visitCount: number;
  visits: PatientTimelineVisit[];
};

function toLocalIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getMonthRange(anchor: Date): { start: Date; end: Date } {
  const start = startOfDay(
    new Date(anchor.getFullYear(), anchor.getMonth(), 1),
  );
  const end = endOfDay(
    new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0),
  );
  return { start, end };
}

export function formatTimelineMonth(anchor: Date): string {
  return anchor.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function shiftMonth(anchor: Date, delta: number): Date {
  return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
}

export function buildMonthDays(anchor: Date, now = new Date()): TimelineDay[] {
  const { start, end } = getMonthRange(anchor);
  const days: TimelineDay[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    days.push({
      date: new Date(cursor),
      iso: toLocalIso(cursor),
      weekday: cursor.toLocaleDateString(undefined, { weekday: "short" }),
      dayNum: cursor.getDate(),
      isWeekend: day === 0 || day === 6,
      isToday: isSameDay(cursor, now),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function buildTimelineRows(
  reservations: Reservation[],
  days: TimelineDay[],
): TimelineRow[] {
  if (days.length === 0) return [];
  const { start, end } = getMonthRange(days[0]!.date);

  return reservations
    .filter((row) => row.deleted_at === null)
    .filter((row) => {
      const when = new Date(row.starts_at);
      return when >= start && when <= end;
    })
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .map((reservation) => {
      const col = dayIndexForDays(days, reservation.starts_at);
      return {
        id: reservation.id,
        label: reservation.patient_name,
        subtitle: reservation.service_label,
        reservation,
        startCol: col,
        endCol: col,
      };
    })
    .filter((row) => row.startCol >= 0);
}

function assignPatientLanes(
  visits: PatientTimelineVisit[],
): PatientTimelineVisit[] {
  const byCol = new Map<number, PatientTimelineVisit[]>();
  for (const visit of visits) {
    const list = byCol.get(visit.startCol) ?? [];
    list.push(visit);
    byCol.set(visit.startCol, list);
  }
  const result: PatientTimelineVisit[] = [];
  for (const colVisits of byCol.values()) {
    colVisits.forEach((visit, lane) => {
      result.push({ ...visit, lane });
    });
  }
  return result;
}

export function buildPatientTimelineRows(
  groups: PatientGroup[],
  days: TimelineDay[],
): PatientTimelineRow[] {
  if (days.length === 0) return [];
  const { start, end } = getMonthRange(days[0]!.date);

  return groups
    .map((group) => {
      const monthVisits = group.visits.filter((visit) => {
        const when = new Date(visit.starts_at);
        return when >= start && when <= end;
      });
      const mapped = monthVisits
        .map((reservation) => {
          const col = dayIndexForDays(days, reservation.starts_at);
          return {
            reservation,
            startCol: col,
            endCol: col,
            lane: 0,
          };
        })
        .filter((visit) => visit.startCol >= 0);

      if (mapped.length === 0) return null;

      const visits = assignPatientLanes(mapped);
      const visitCount = group.visits.length;
      const subtitle =
        visitCount === 1
          ? (group.visits[0]?.service_label ?? "Patient")
          : `${visitCount} visits`;

      return {
        patientKey: group.patientKey,
        label: group.displayName,
        subtitle,
        phone: group.phone,
        email: group.email,
        visitCount: group.visits.length,
        visits,
      };
    })
    .filter((row): row is PatientTimelineRow => row !== null);
}

export function dayIndexForDays(days: TimelineDay[], startsAt: string): number {
  const iso = toLocalIso(new Date(startsAt));
  return days.findIndex((day) => day.iso === iso);
}

export function formatBarTime(startsAt: string): string {
  const when = new Date(startsAt);
  const hours = String(when.getHours()).padStart(2, "0");
  const minutes = String(when.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function filterReservationsForTimeline(
  reservations: Reservation[],
  status: TimelineStatusFilter,
): Reservation[] {
  const active = reservations.filter((row) => row.deleted_at === null);
  if (status === "all") return active;
  return active.filter((row) => row.status === status);
}

export function timelineBarTone(status: ReservationStatus): {
  bar: string;
  icon: string;
  title: string;
  badge: string;
  dot: string;
  statusLabel: string;
} {
  switch (status) {
    case "pending":
      return {
        bar: "border border-white/80 bg-gradient-to-r from-sky-100/95 via-sky-50/90 to-white/80 backdrop-blur-md",
        icon: "bg-[#0f2744]/10 text-[#0f2744]",
        title: "text-[#0f2744]",
        badge: "bg-white text-[#0f2744]",
        dot: "bg-[#c9a962]",
        statusLabel: "Pending",
      };
    case "confirmed":
      return {
        bar: "bg-gradient-to-r from-[#9b7dff] via-[#7d8cf8] to-[#5aa3f7]",
        icon: "bg-[#0f2744]/12 text-[#0f2744]",
        title: "text-[#0f2744]",
        badge: "bg-white text-[#0f2744]",
        dot: "bg-emerald-500",
        statusLabel: "Approved",
      };
    case "completed":
      return {
        bar: "bg-gradient-to-r from-[#5fe0a0] via-[#3ecf8e] to-[#2fbf7a]",
        icon: "bg-[#0f2744]/12 text-[#0f2744]",
        title: "text-[#0f2744]",
        badge: "bg-white text-[#0f2744]",
        dot: "bg-emerald-500",
        statusLabel: "Completed",
      };
    case "cancelled":
      return {
        bar: "border border-white/60 bg-gradient-to-r from-[#f8dcdc]/95 to-[#efc2c2]/90 backdrop-blur-sm",
        icon: "bg-[#7f1d1d]/10 text-[#7f1d1d]",
        title: "text-[#7f1d1d]",
        badge: "bg-white text-[#7f1d1d]",
        dot: "bg-red-500",
        statusLabel: "Cancelled",
      };
    case "no_show":
      return {
        bar: "border border-white/60 bg-gradient-to-r from-[#ffedd5]/95 to-[#fed7aa]/90 backdrop-blur-sm",
        icon: "bg-orange-900/10 text-orange-900",
        title: "text-orange-900",
        badge: "bg-white text-orange-900",
        dot: "bg-orange-500",
        statusLabel: "No-show",
      };
    default:
      return {
        bar: "bg-[#e6e8ec]",
        icon: "bg-[#0f2744]/10 text-[#0f2744]",
        title: "text-[#0f2744]",
        badge: "bg-white text-[#0f2744]",
        dot: "bg-[#6b7280]",
        statusLabel: status,
      };
  }
}

export const TIMELINE_PATIENT_WIDTH = "13rem";
export const TIMELINE_DAY_WIDTH = "5rem";
export const TIMELINE_GRID_GAP = "0.5rem";

export function timelineGridTemplate(dayCount: number): string {
  return `${TIMELINE_PATIENT_WIDTH} repeat(${dayCount}, ${TIMELINE_DAY_WIDTH})`;
}

export function barGridColumn(startCol: number, endCol: number): string {
  const start = startCol + 2;
  const span = endCol - startCol + 1;
  return `${start} / span ${span}`;
}

export function todayLineOffset(
  dayIndex: number,
  dayCount: number,
): string | null {
  if (dayIndex < 0 || dayIndex >= dayCount) return null;
  return `calc(${TIMELINE_PATIENT_WIDTH} + ${TIMELINE_GRID_GAP} + ${dayIndex} * (${TIMELINE_DAY_WIDTH} + ${TIMELINE_GRID_GAP}) + (${TIMELINE_DAY_WIDTH} / 2))`;
}

export function reservationDayIso(startsAt: string): string {
  return toLocalIso(new Date(startsAt));
}

export function shiftStartsAtToDate(
  startsAt: string,
  targetDate: string,
): string {
  const when = new Date(startsAt);
  const hours = String(when.getHours()).padStart(2, "0");
  const minutes = String(when.getMinutes()).padStart(2, "0");
  return new Date(`${targetDate}T${hours}:${minutes}:00`).toISOString();
}

export function formatCalendarMonthLabel(anchor: Date): string {
  return anchor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export type CalendarGridDay = TimelineDay & {
  isCurrentMonth: boolean;
};

export const CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
/** Always 6 weeks so month slides keep a stable height. */
export const CALENDAR_GRID_WEEKS = 6;
export const CALENDAR_GRID_DAYS = CALENDAR_GRID_WEEKS * 7;

export function buildCalendarGrid(
  anchor: Date,
  now = new Date(),
): CalendarGridDay[] {
  const { start: monthStart } = getMonthRange(anchor);
  const gridStart = new Date(monthStart);
  const startDow = gridStart.getDay();
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
  gridStart.setDate(gridStart.getDate() + mondayOffset);

  const days: CalendarGridDay[] = [];
  const cursor = new Date(gridStart);
  for (let i = 0; i < CALENDAR_GRID_DAYS; i += 1) {
    const day = cursor.getDay();
    days.push({
      date: new Date(cursor),
      iso: toLocalIso(cursor),
      weekday: cursor.toLocaleDateString(undefined, { weekday: "short" }),
      dayNum: cursor.getDate(),
      isWeekend: day === 0 || day === 6,
      isToday: isSameDay(cursor, now),
      isCurrentMonth: cursor.getMonth() === anchor.getMonth(),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function groupReservationsByDay(
  reservations: Reservation[],
): Map<string, Reservation[]> {
  const map = new Map<string, Reservation[]>();
  for (const reservation of reservations) {
    if (reservation.deleted_at !== null) continue;
    const iso = toLocalIso(new Date(reservation.starts_at));
    const list = map.get(iso) ?? [];
    list.push(reservation);
    map.set(iso, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }
  return map;
}

export function formatCalendarTime(startsAt: string): string {
  return new Date(startsAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatCalendarDayLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function calendarEventAccent(status: ReservationStatus): string {
  switch (status) {
    case "pending":
      return "border-l-[#c9a962] bg-[#c9a962]/10";
    case "confirmed":
      return "border-l-[#7c5cff] bg-[#7c5cff]/10";
    case "completed":
      return "border-l-emerald-500 bg-emerald-500/10";
    case "cancelled":
      return "border-l-red-400 bg-red-400/10";
    case "no_show":
      return "border-l-orange-400 bg-orange-400/10";
    default:
      return "border-l-[#6b7280] bg-[#f6f7f9]";
  }
}

export function timelineEventTitle(
  status: ReservationStatus,
  serviceLabel: string,
): string {
  switch (status) {
    case "pending":
      return serviceLabel || "Pending visit";
    case "confirmed":
      return serviceLabel || "Confirmed visit";
    case "completed":
      return serviceLabel || "Completed visit";
    case "cancelled":
      return "Cancelled";
    case "no_show":
      return "No-show";
    default:
      return serviceLabel;
  }
}
