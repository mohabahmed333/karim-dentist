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

export type ReservationListFilters = {
  from: string;
  to: string;
  status: FilterStatus;
  /** Empty = all services. */
  serviceIds: string[];
  q: string;
};

export function sanitizeIlike(q: string): string {
  return q.replace(/[%_,]/g, "").trim();
}

export function isReservationStatus(
  value: FilterStatus,
): value is Exclude<FilterStatus, "all"> {
  return value !== "all";
}
