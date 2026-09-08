"use client";

import { useMemo } from "react";
import type { CollectionServerFiltering } from "@/features/admin/components/CollectionTable";
import { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";

const PATIENT_SORT_VALUES = [
  "name",
  "phone",
  "treatments",
  "lastVisit",
  "nextVisit",
] as const;

export type PatientSortKey = (typeof PATIENT_SORT_VALUES)[number];

type Query = ReturnType<typeof useReservationFilterQuery>;

/**
 * Patients reuse reservation nuqs params (q, page, limit, sort, dir).
 * Sort keys are patient column keys (not reservation DB columns).
 */
export function usePatientTableServerFiltering(
  total: number,
  query: Query,
): CollectionServerFiltering {
  const { filters, setFilters } = query;

  return useMemo((): CollectionServerFiltering => {
    const sort = (
      PATIENT_SORT_VALUES.includes(filters.sort as PatientSortKey)
        ? filters.sort
        : "name"
    ) as PatientSortKey;
    const dir = filters.dir === "asc" ? "asc" : "desc";

    return {
      total,
      q: filters.q,
      onQChange: (q) => {
        void setFilters({ q });
      },
      sortKey: sort,
      sortDir: dir,
      onSortChange: (columnKey) => {
        const nextSort = PATIENT_SORT_VALUES.includes(
          columnKey as PatientSortKey,
        )
          ? (columnKey as PatientSortKey)
          : "name";
        if (sort === nextSort) {
          void setFilters({
            dir: dir === "asc" ? "desc" : "asc",
          });
          return;
        }
        void setFilters({ sort: nextSort, dir: "asc" });
      },
      page: Math.max(1, filters.page ?? 1),
      pageSize: Math.min(100, Math.max(1, filters.limit ?? 8)),
      onPageChange: (page) => {
        void setFilters({ page: Math.max(1, page) });
      },
      onPageSizeChange: (limit) => {
        void setFilters({ limit: Math.min(100, Math.max(1, limit)), page: 1 });
      },
      onReset: () => {
        void setFilters({
          q: "",
          sort: "name",
          dir: "asc",
          page: 1,
        });
      },
    };
  }, [filters, setFilters, total]);
}
