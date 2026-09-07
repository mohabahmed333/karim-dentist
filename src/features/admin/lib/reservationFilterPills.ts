import {
  COMPARE_OPTIONS,
  formatRangeLabel,
  presetIdForRange,
  RANGE_PRESET_MESSAGE_KEYS,
} from "@/features/admin/lib/dateRangeModel";
import {
  defaultFromTo,
  rangeFromDayIso,
} from "@/features/admin/lib/reservationFilters";
import { parseServiceFilter } from "@/features/admin/lib/serviceFilter";
import type { Service } from "@/services/services/types";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import type { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";
import {
  COHORT_KEYS,
  STATUS_KEYS,
} from "@/features/admin/lib/reservationFilterLabels";

type Query = ReturnType<typeof useReservationFilterQuery>;
type T = (key: AdminMessageKey) => string;
type Pill = { id: string; label: string; onClear: () => void };

function datePillLabel(
  range: ReturnType<typeof rangeFromDayIso>,
  t: T,
  locale: string,
) {
  const id = presetIdForRange(range);
  const preset =
    id === "custom"
      ? formatRangeLabel(range, locale)
      : t(RANGE_PRESET_MESSAGE_KEYS[id] as AdminMessageKey);
  return `${t("admin.filters.date")} · ${preset}`;
}

export function buildReservationFilterPills(
  query: Query,
  services: Service[],
  flags: { showCompare: boolean; showCohort: boolean },
  t: T,
  locale: string = "en",
): Pill[] {
  const { filters, setFilters, setSearchDraft } = query;
  const defaults = defaultFromTo();
  const range = rangeFromDayIso(
    filters.from ?? defaults.from,
    filters.to ?? defaults.to,
  );
  const dateLocale = locale === "ar" ? "ar-EG" : "en-US";
  const selectedServiceIds = parseServiceFilter(filters.service);
  const serviceLabel =
    selectedServiceIds.length === 0
      ? null
      : selectedServiceIds.length === 1
        ? (services.find((s) => s.id === selectedServiceIds[0])?.title ??
          t("admin.reservations.service"))
        : t("admin.filters.servicesSelected").replace(
            "{count}",
            String(selectedServiceIds.length),
          );
  const compareLabel =
    COMPARE_OPTIONS.find((o) => o.id === filters.compare)?.label ??
    t("admin.reservations.previousPeriod");

  return [
    filters.from || filters.to
      ? {
          id: "range",
          label: datePillLabel(range, t, dateLocale),
          onClear: () => void setFilters({ from: null, to: null }),
        }
      : null,
    filters.status !== "all"
      ? {
          id: "status",
          label: `${t("admin.reservations.status")} · ${t(STATUS_KEYS[filters.status])}`,
          onClear: () => void setFilters({ status: "all" }),
        }
      : null,
    serviceLabel
      ? {
          id: "service",
          label: `${t("admin.reservations.service")} · ${serviceLabel}`,
          onClear: () => void setFilters({ service: "all" }),
        }
      : null,
    filters.q.trim()
      ? {
          id: "q",
          label: `${t("admin.filters.search")} · ${filters.q.trim()}`,
          onClear: () => {
            setSearchDraft("");
            void setFilters({ q: "" });
          },
        }
      : null,
    flags.showCompare && filters.compare !== "previous_period"
      ? {
          id: "compare",
          label: `${t("admin.filters.compare")} · ${compareLabel}`,
          onClear: () => void setFilters({ compare: "previous_period" }),
        }
      : null,
    flags.showCohort && filters.cohort !== "all"
      ? {
          id: "cohort",
          label: `${t("admin.filters.patients")} · ${t(COHORT_KEYS[filters.cohort])}`,
          onClear: () => void setFilters({ cohort: "all" }),
        }
      : null,
  ].filter(Boolean) as Pill[];
}
