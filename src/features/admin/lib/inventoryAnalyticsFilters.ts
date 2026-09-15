import { createSearchParamsCache, parseAsStringLiteral } from "nuqs/server";

export const INVENTORY_ANALYTICS_RANGE_VALUES = ["30d", "90d"] as const;
export type InventoryAnalyticsRange = (typeof INVENTORY_ANALYTICS_RANGE_VALUES)[number];

export const inventoryAnalyticsFilterParsers = {
  range: parseAsStringLiteral(INVENTORY_ANALYTICS_RANGE_VALUES).withDefault("30d"),
};

export const inventoryAnalyticsFiltersCache = createSearchParamsCache(
  inventoryAnalyticsFilterParsers,
);

export function rangeDays(range: InventoryAnalyticsRange): number {
  return range === "90d" ? 90 : 30;
}

/** A [from, to] ISO window of `rangeDays(range)` days, ending at the end of `now`'s day. */
export function resolveInventoryAnalyticsRange(
  range: InventoryAnalyticsRange,
  now = new Date(),
): { from: string; to: string } {
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setDate(from.getDate() - (rangeDays(range) - 1));
  from.setHours(0, 0, 0, 0);
  return { from: from.toISOString(), to: to.toISOString() };
}
