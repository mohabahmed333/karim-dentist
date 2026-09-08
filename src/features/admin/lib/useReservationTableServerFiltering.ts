"use client";

import { useMemo } from "react";
import type { CollectionServerFiltering } from "@/features/admin/components/CollectionTable";
import {
  RESERVATION_SORT_VALUES,
  type ReservationSortKey,
} from "@/features/admin/lib/reservationFilters";
import { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";

/** Column key → reservation sort column. */
const COLUMN_TO_SORT: Record<string, ReservationSortKey> = {
  patient: "patient_name",
  phone: "phone",
  service: "service_label",
  when: "starts_at",
  status: "status",
};

const SORT_TO_COLUMN: Record<ReservationSortKey, string> = {
  patient_name: "patient",
  phone: "phone",
  service_label: "service",
  starts_at: "when",
  status: "status",
};

type Query = ReturnType<typeof useReservationFilterQuery>;

export function useReservationTableServerFiltering(
  total: number,
  query: Query,
): CollectionServerFiltering {
  const { filters, setFilters } = query;

  return useMemo((): CollectionServerFiltering => {
    const sort = (
      RESERVATION_SORT_VALUES.includes(filters.sort as ReservationSortKey)
        ? filters.sort
        : "starts_at"
    ) as ReservationSortKey;
    const dir = filters.dir === "asc" ? "asc" : "desc";

    return {
      total,
      q: filters.q,
      onQChange: (q) => {
        void setFilters({ q });
      },
      sortKey: SORT_TO_COLUMN[sort] ?? "when",
      sortDir: dir,
      onSortChange: (columnKey) => {
        const nextSort = COLUMN_TO_SORT[columnKey] ?? "starts_at";
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
          sort: "starts_at",
          dir: "desc",
          page: 1,
        });
      },
    };
  }, [filters, setFilters, total]);
}
