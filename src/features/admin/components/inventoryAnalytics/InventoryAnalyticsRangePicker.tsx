"use client";

import { useInventoryAnalyticsFilterQuery } from "@/features/admin/lib/useInventoryAnalyticsFilterQuery";
import { INVENTORY_ANALYTICS_RANGE_VALUES } from "@/features/admin/lib/inventoryAnalyticsFilters";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function InventoryAnalyticsRangePicker() {
  const t = useTranslations();
  const { filters, setFilters } = useInventoryAnalyticsFilterQuery();

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-[var(--admin-border)]">
      {INVENTORY_ANALYTICS_RANGE_VALUES.map((value) => (
        <button
          key={value}
          type="button"
          className={cn(
            "px-3 py-1.5 text-sm font-medium",
            filters.range === value
              ? "bg-[var(--admin-primary)] text-white"
              : "bg-[var(--admin-panel)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
          )}
          onClick={() => void setFilters({ range: value })}
        >
          {t(
            value === "30d"
              ? "admin.inventoryAnalytics.range.30d"
              : "admin.inventoryAnalytics.range.90d",
          )}
        </button>
      ))}
    </div>
  );
}
