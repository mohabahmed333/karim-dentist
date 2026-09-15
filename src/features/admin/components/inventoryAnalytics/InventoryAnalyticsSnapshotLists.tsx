"use client";

import type { ExpiringBatch, ReorderSuggestion } from "@/services/inventory/statsQueries";
import { useLocale, useTranslations } from "@/lib/i18n";
import { localizedItemName } from "@/services/inventory/i18nMaps";

export function ListExpiringSoon({ batches }: { batches: ExpiringBatch[] }) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.expiringSoon")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.expiringSoonDesc")}
      </p>
      {batches.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.expiringSoonEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto">
          {batches.map((batch) => (
            <li key={batch.batchId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-[var(--admin-text)]">
                {localizedItemName(locale === "ar" ? "ar" : "en", batch.itemName, batch.itemNameAr)}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {batch.qtyRemaining}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  batch.daysUntilExpiry <= 7
                    ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
                    : "bg-orange-50 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300"
                }`}
              >
                {batch.daysUntilExpiry}d
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ListReorderSuggestions({
  suggestions,
}: {
  suggestions: ReorderSuggestion[];
}) {
  const t = useTranslations();
  const { locale } = useLocale();

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.reorderSuggestions")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.reorderSuggestionsDesc")}
      </p>
      {suggestions.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.reorderSuggestionsEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto">
          {suggestions.map((item) => (
            <li key={item.itemId} className="flex items-center justify-between gap-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-[var(--admin-text)]">
                {localizedItemName(locale === "ar" ? "ar" : "en", item.itemName, item.itemNameAr)}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {item.qtyOnHand}/{item.minStockLevel}
              </span>
              <span className="shrink-0 text-xs text-[var(--admin-muted)]">
                {item.supplierName ?? t("admin.inventoryAnalytics.chart.unknownSupplier")}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-[var(--admin-text)]">
                +{item.reorderQty}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
