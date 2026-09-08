import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { rangeFromPreset } from "@/features/admin/lib/dateRangeModel";
import type { CompareMode } from "@/features/admin/lib/dateRangeModel";
import {
  FILTER_STATUS_VALUES,
  RESERVATION_SORT_VALUES,
  TABLE_SORT_VALUES,
  type FilterStatus,
  type ReservationListFilters,
  type ReservationSortKey,
} from "@/services/reservations/listFilters";
import { parseServiceFilter } from "@/features/admin/lib/serviceFilter";

export type { FilterStatus, ReservationListFilters, ReservationSortKey };
export { FILTER_STATUS_VALUES, RESERVATION_SORT_VALUES, TABLE_SORT_VALUES };

export const COMPARE_VALUES = [
  "previous_period",
  "previous_year",
  "none",
] as const satisfies readonly CompareMode[];

export const PATIENT_COHORT_VALUES = [
  "all",
  "returning",
  "new",
  "upcoming",
] as const;
export type PatientCohort = (typeof PATIENT_COHORT_VALUES)[number];

export const SORT_DIR_VALUES = ["asc", "desc"] as const;

export function dayIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function defaultFromTo(now = new Date()): { from: string; to: string } {
  const range = rangeFromPreset("today", now);
  return { from: dayIso(range.start), to: dayIso(range.end) };
}

/**
 * Overview home: enough history for charts + forward days for Day Schedule
 * navigation (independent of the "today" preset used elsewhere).
 */
export function defaultOverviewFromTo(now = new Date()): {
  from: string;
  to: string;
} {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
  return { from: dayIso(start), to: dayIso(end) };
}

/** Calendar month range — used by the reservations page so month grid bookings stay visible. */
export function defaultMonthFromTo(now = new Date()): { from: string; to: string } {
  const range = rangeFromPreset("this_month", now);
  return { from: dayIso(range.start), to: dayIso(range.end) };
}

export function rangeFromDayIso(from: string, to: string) {
  return {
    start: new Date(`${from}T00:00:00`),
    end: new Date(`${to}T23:59:59.999`),
  };
}

export const reservationFilterParsers = {
  from: parseAsString,
  to: parseAsString,
  status: parseAsStringLiteral(FILTER_STATUS_VALUES).withDefault("all"),
  service: parseAsString.withDefault("all"),
  q: parseAsString.withDefault(""),
  compare: parseAsStringLiteral(COMPARE_VALUES).withDefault("previous_period"),
  cohort: parseAsStringLiteral(PATIENT_COHORT_VALUES).withDefault("all"),
  sort: parseAsStringLiteral(TABLE_SORT_VALUES).withDefault("starts_at"),
  dir: parseAsStringLiteral(SORT_DIR_VALUES).withDefault("desc"),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(8),
};

export const reservationFiltersCache = createSearchParamsCache(
  reservationFilterParsers,
);

export function resolveReservationFilters(
  raw: {
    from: string | null;
    to: string | null;
    status: FilterStatus;
    service: string;
    q: string;
    sort?: string;
    dir?: "asc" | "desc";
    page?: number;
    limit?: number;
  },
  defaults: { from: string; to: string } = defaultFromTo(),
): ReservationListFilters {
  const from =
    raw.from && /^\d{4}-\d{2}-\d{2}$/.test(raw.from) ? raw.from : defaults.from;
  const to =
    raw.to && /^\d{4}-\d{2}-\d{2}$/.test(raw.to) ? raw.to : defaults.to;
  return {
    from: from <= to ? from : to,
    to: from <= to ? to : from,
    status: raw.status,
    serviceIds: parseServiceFilter(raw.service),
    q: raw.q.trim(),
    sort: (RESERVATION_SORT_VALUES as readonly string[]).includes(raw.sort ?? "")
      ? (raw.sort as ReservationSortKey)
      : "starts_at",
    dir: raw.dir ?? "desc",
    page: Math.max(1, raw.page ?? 1),
    limit: Math.min(100, Math.max(1, raw.limit ?? 8)),
  };
}
