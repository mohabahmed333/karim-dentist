"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { reservationFilterParsers } from "@/features/admin/lib/reservationFilters";

export function useReservationFilterQuery(
  onPendingChange?: (pending: boolean) => void,
) {
  const [pending, startTransition] = useTransition();
  const [rawFilters, setRawFilters] = useQueryStates(reservationFilterParsers, {
    shallow: false,
    history: "replace",
    startTransition,
  });
  const [searchDraft, setSearchDraft] = useState(rawFilters.q);

  const setFilters = useCallback(
    (
      patch: Parameters<typeof setRawFilters>[0],
      options?: Parameters<typeof setRawFilters>[1],
    ) => {
      if (typeof patch === "function") {
        return setRawFilters((prev) => {
          const next = patch(prev);
          if (
            next &&
            typeof next === "object" &&
            !("page" in next) &&
            Object.keys(next).some((k) => k !== "page")
          ) {
            return { ...next, page: 1 };
          }
          return next;
        }, options);
      }
      if (
        patch &&
        typeof patch === "object" &&
        !("page" in patch) &&
        Object.keys(patch).length > 0
      ) {
        return setRawFilters({ ...patch, page: 1 }, options);
      }
      return setRawFilters(patch, options);
    },
    [setRawFilters],
  );

  useEffect(() => {
    onPendingChange?.(pending);
  }, [pending, onPendingChange]);

  useEffect(() => {
    setSearchDraft(rawFilters.q);
  }, [rawFilters.q]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (searchDraft === rawFilters.q) return;
      void setFilters({ q: searchDraft });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [searchDraft, rawFilters.q, setFilters]);

  function clearAll() {
    setSearchDraft("");
    void setRawFilters({
      from: null,
      to: null,
      status: "all",
      service: "all",
      q: "",
      compare: "previous_period",
      cohort: "all",
      sort: "starts_at",
      dir: "desc",
      page: 1,
      limit: 8,
    });
  }

  return {
    filters: rawFilters,
    setFilters,
    searchDraft,
    setSearchDraft,
    pending,
    clearAll,
  };
}
