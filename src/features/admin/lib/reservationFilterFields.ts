import {
  Briefcase,
  CalendarDays,
  CircleDot,
} from "lucide-react";
import type { FilterField } from "@/components/ui/filter-menu";
import { FilterMenuDatePanel } from "@/features/admin/components/FilterMenuDatePanel";
import {
  dayIso,
  defaultFromTo,
  FILTER_STATUS_VALUES,
  rangeFromDayIso,
} from "@/features/admin/lib/reservationFilters";
import {
  presetIdForRange,
  RANGE_PRESET_MESSAGE_KEYS,
  rangeFromPreset,
} from "@/features/admin/lib/dateRangeModel";
import {
  parseServiceFilter,
  serializeServiceFilter,
  toggleServiceId,
} from "@/features/admin/lib/serviceFilter";
import type { Service } from "@/services/services/types";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";
import type { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";
import { appendOptionalReservationFields } from "@/features/admin/lib/reservationFilterExtras";
import { STATUS_KEYS } from "@/features/admin/lib/reservationFilterLabels";
import { createElement } from "react";

type Query = ReturnType<typeof useReservationFilterQuery>;
type T = (key: AdminMessageKey) => string;

export function buildReservationFilterFields(
  query: Query,
  services: Service[],
  flags: { showCompare: boolean; showCohort: boolean },
  t: T,
): FilterField[] {
  const { filters, setFilters } = query;
  const defaults = defaultFromTo();
  const range = rangeFromDayIso(
    filters.from ?? defaults.from,
    filters.to ?? defaults.to,
  );
  const selectedServiceIds = parseServiceFilter(filters.service);
  const serviceHint =
    selectedServiceIds.length === 0
      ? undefined
      : selectedServiceIds.length === 1
        ? (services.find((s) => s.id === selectedServiceIds[0])?.title ??
          t("admin.reservations.service"))
        : t("admin.filters.servicesSelected").replace(
            "{count}",
            String(selectedServiceIds.length),
          );

  const fields: FilterField[] = [
    {
      id: "date",
      kind: "date",
      label: t("admin.filters.date"),
      hint: (() => {
        const id = presetIdForRange(range);
        return id === "custom"
          ? t("admin.date.custom")
          : t(RANGE_PRESET_MESSAGE_KEYS[id] as AdminMessageKey);
      })(),
      icon: CalendarDays,
      panel: createElement(FilterMenuDatePanel, {
        range,
        onApply: (next, presetId) => {
          const applied =
            presetId !== "custom" ? rangeFromPreset(presetId) : next;
          void setFilters({
            from: dayIso(applied.start),
            to: dayIso(applied.end),
          });
        },
      }),
    },
    {
      id: "status",
      kind: "choice",
      label: t("admin.reservations.status"),
      hint:
        filters.status === "all" ? undefined : t(STATUS_KEYS[filters.status]),
      icon: CircleDot,
      value: filters.status,
      options: FILTER_STATUS_VALUES.map((status) => ({
        id: status,
        label: t(STATUS_KEYS[status]),
      })),
      onSelect: (id) =>
        void setFilters({
          status: id as (typeof FILTER_STATUS_VALUES)[number],
        }),
    },
    {
      id: "service",
      kind: "multi",
      label: t("admin.reservations.service"),
      hint: serviceHint,
      icon: Briefcase,
      values: selectedServiceIds,
      options: services.map((service) => ({
        id: service.id,
        label: service.title,
      })),
      searchPlaceholder: t("admin.filters.searchServices"),
      emptyLabel: t("admin.filters.noMatches"),
      onToggle: (id) => {
        const next = toggleServiceId(selectedServiceIds, id);
        void setFilters({ service: serializeServiceFilter(next) });
      },
    },
  ];

  return appendOptionalReservationFields(fields, query, flags, t);
}
