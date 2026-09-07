import {
  createSearchParamsCache,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { rangeFromPreset } from "@/features/admin/lib/dateRangeModel";
import type { CompareMode } from "@/features/admin/lib/dateRangeModel";
import {
  FILTER_STATUS_VALUES,
  type FilterStatus,
  type ReservationListFilters,
} from "@/services/reservations/listFilters";
import { parseServiceFilter } from "@/features/admin/lib/serviceFilter";

export type { FilterStatus, ReservationListFilters };
export { FILTER_STATUS_VALUES };

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

export function dayIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function defaultFromTo(now = new Date()): { from: string; to: string } {
  const range = rangeFromPreset("today", now);
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
};

export const reservationFiltersCache = createSearchParamsCache(
  reservationFilterParsers,
);

export function resolveReservationFilters(raw: {
  from: string | null;
  to: string | null;
  status: FilterStatus;
  service: string;
  q: string;
}): ReservationListFilters {
  const defaults = defaultFromTo();
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
  };
}
