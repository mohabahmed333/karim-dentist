import { GitCompare, Users } from "lucide-react";
import type { FilterField } from "@/components/ui/filter-menu";
import { COMPARE_OPTIONS } from "@/features/admin/lib/dateRangeModel";
import {
  PATIENT_COHORT_VALUES,
  type PatientCohort,
} from "@/features/admin/lib/reservationFilters";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import type { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";
import { COHORT_KEYS } from "@/features/admin/lib/reservationFilterLabels";

type Query = ReturnType<typeof useReservationFilterQuery>;
type T = (key: AdminMessageKey) => string;

export function appendOptionalReservationFields(
  fields: FilterField[],
  query: Query,
  flags: { showCompare: boolean; showCohort: boolean },
  t: T,
): FilterField[] {
  const { filters, setFilters } = query;
  const next = [...fields];

  if (flags.showCompare) {
    const compareLabel =
      COMPARE_OPTIONS.find((o) => o.id === filters.compare)?.label ??
      t("admin.reservations.previousPeriod");
    next.push({
      id: "compare",
      kind: "choice",
      label: t("admin.filters.compare"),
      hint: filters.compare === "previous_period" ? undefined : compareLabel,
      icon: GitCompare,
      value: filters.compare,
      options: COMPARE_OPTIONS.map((opt) => ({ id: opt.id, label: opt.label })),
      onSelect: (id) =>
        void setFilters({
          compare: id as (typeof COMPARE_OPTIONS)[number]["id"],
        }),
    });
  }

  if (flags.showCohort) {
    next.push({
      id: "cohort",
      kind: "choice",
      label: t("admin.filters.patients"),
      hint: filters.cohort === "all" ? undefined : t(COHORT_KEYS[filters.cohort]),
      icon: Users,
      value: filters.cohort,
      options: PATIENT_COHORT_VALUES.map((cohort) => ({
        id: cohort,
        label: t(COHORT_KEYS[cohort]),
      })),
      onSelect: (id) =>
        void setFilters({
          cohort: id as PatientCohort,
        }),
    });
  }

  return next;
}
