import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import {
  FILTER_STATUS_VALUES,
  type PatientCohort,
} from "@/features/admin/lib/reservationFilters";

export const STATUS_KEYS: Record<
  (typeof FILTER_STATUS_VALUES)[number],
  AdminMessageKey
> = {
  all: "admin.reservations.allStatuses",
  pending: "admin.reservations.pending",
  confirmed: "admin.reservations.confirmed",
  cancelled: "admin.reservations.cancelled",
  completed: "admin.reservations.completed",
  no_show: "admin.reservations.noShow",
};

export const COHORT_KEYS: Record<PatientCohort, AdminMessageKey> = {
  all: "admin.filters.allPatients",
  returning: "admin.filters.returning",
  new: "admin.filters.new",
  upcoming: "admin.filters.upcoming",
};
