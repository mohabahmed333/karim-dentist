"use client";

import { useQueryStates } from "nuqs";
import { inventoryAnalyticsFilterParsers } from "@/features/admin/lib/inventoryAnalyticsFilters";

export function useInventoryAnalyticsFilterQuery() {
  const [filters, setFilters] = useQueryStates(inventoryAnalyticsFilterParsers, {
    shallow: false,
    history: "replace",
  });
  return { filters, setFilters };
}
