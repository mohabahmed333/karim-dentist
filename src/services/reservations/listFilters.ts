export type FilterStatus =
  | "all"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";

export const FILTER_STATUS_VALUES = [
  "all",
  "pending",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
] as const satisfies readonly FilterStatus[];

export const RESERVATION_SORT_VALUES = [
  "starts_at",
  "patient_name",
  "phone",
  "service_label",
  "status",
] as const;

export type ReservationSortKey = (typeof RESERVATION_SORT_VALUES)[number];

/** Shared URL `sort` values across reservations + patients tables. */
export const TABLE_SORT_VALUES = [
  ...RESERVATION_SORT_VALUES,
  "name",
  "treatments",
  "lastVisit",
  "nextVisit",
] as const;

export type TableSortKey = (typeof TABLE_SORT_VALUES)[number];

export type ReservationListFilters = {
  from: string;
  to: string;
  status: FilterStatus;
  /** Empty = all services. */
  serviceIds: string[];
  q: string;
  sort: ReservationSortKey;
  dir: "asc" | "desc";
  page: number;
  limit: number;
};

export function sanitizeIlike(q: string): string {
  return q.replace(/[%_,]/g, "").trim();
}

export function isReservationStatus(
  value: FilterStatus,
): value is Exclude<FilterStatus, "all"> {
  return value !== "all";
}
