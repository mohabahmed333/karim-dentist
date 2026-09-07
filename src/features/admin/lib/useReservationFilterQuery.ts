"use client";

import { useEffect, useState, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { reservationFilterParsers } from "@/features/admin/lib/reservationFilters";

export function useReservationFilterQuery(
  onPendingChange?: (pending: boolean) => void,
) {
  const [pending, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(reservationFilterParsers, {
    shallow: false,
    history: "replace",
    startTransition,
  });
  const [searchDraft, setSearchDraft] = useState(filters.q);

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    setSearchDraft(filters.q);
  }, [filters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft === filters.q) return;
      void setFilters({ q: searchDraft });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [searchDraft, filters.q, setFilters]);

  function clearAll() {
    setSearchDraft("");
    void setFilters({
      from: null,
      to: null,
      status: "all",
      service: "all",
      q: "",
      compare: "previous_period",
      cohort: "all",
    });
  }

  return { filters, setFilters, searchDraft, setSearchDraft, pending, clearAll };
}
