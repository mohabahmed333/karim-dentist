"use client";

import { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";
import { buildReservationFilterFields } from "@/features/admin/lib/reservationFilterFields";
import { buildReservationFilterPills } from "@/features/admin/lib/reservationFilterPills";
import {
  FilterMenu,
  FilterMenuContent,
  FilterMenuFields,
  FilterMenuTrigger,
} from "@/components/ui/filter-menu";
import type { Service } from "@/services/services/types";
import { useLocale, useTranslations } from "@/lib/i18n";

type Props = {
  services: Service[];
  showCompare?: boolean;
  showCohort?: boolean;
  onPendingChange?: (pending: boolean) => void;
};

export function AdminReservationFilters({
  services,
  showCompare = false,
  showCohort = false,
  onPendingChange,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const query = useReservationFilterQuery(onPendingChange);
  const fields = buildReservationFilterFields(
    query,
    services,
    { showCompare, showCohort },
    t,
  );
  const pills = buildReservationFilterPills(
    query,
    services,
    { showCompare, showCohort },
    t,
    locale,
  );

  return (
    <div className={query.pending ? "opacity-80" : undefined}>
      <FilterMenu fields={fields}>
        <FilterMenuTrigger
          label={t("admin.reservations.filters")}
          pills={pills}
          onClearAll={query.clearAll}
          clearAllLabel={t("admin.filters.clearAll")}
        />
        <FilterMenuContent
          searchPlaceholder={t("admin.filters.searchMenu")}
          emptyLabel={t("admin.filters.noMatches")}
        >
          <FilterMenuFields />
        </FilterMenuContent>
      </FilterMenu>
    </div>
  );
}
