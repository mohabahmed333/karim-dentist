import type { ReservationStatus } from "@/services/reservations/types";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

/**
 * One label per reservation status, shared by every surface that shows one.
 *
 * The enum values themselves are database identifiers (`no_show`), never text
 * to put in front of a user — and they do not translate.
 */
export const RESERVATION_STATUS_LABEL_KEYS: Record<
  ReservationStatus,
  AdminMessageKey
> = {
  pending: "admin.overview.chart.status.pending",
  confirmed: "admin.overview.chart.status.confirmed",
  completed: "admin.overview.chart.status.completed",
  cancelled: "admin.overview.chart.status.cancelled",
  no_show: "admin.overview.chart.status.noShow",
};
