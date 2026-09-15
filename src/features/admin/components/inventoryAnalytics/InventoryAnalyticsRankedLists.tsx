"use client";

import type { SupplierSpend, TopConsumedItem } from "@/services/inventory/statsQueries";
import { useLocale, useTranslations } from "@/lib/i18n";
import { localizedItemName } from "@/services/inventory/i18nMaps";

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

export function ListTopConsumedItems({
  items,
}: {
  items: TopConsumedItem[];
}) {
  const t = useTranslations();
  const { locale } = useLocale();
  const rows = items.slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.cost));

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.topConsumedItems")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.topConsumedItemsDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.topConsumedItemsEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((item, index) => (
            <li key={item.itemId} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--admin-text)]">
                    {localizedItemName(locale === "ar" ? "ar" : "en", item.itemName, item.itemNameAr)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatEgp(item.cost)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-primary)]"
                    style={{ width: `${(item.cost / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ListSupplierSpend({
  suppliers,
}: {
  suppliers: SupplierSpend[];
}) {
  const t = useTranslations();
  const rows = suppliers.slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.cost));

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.supplierSpend")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.supplierSpendDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.supplierSpendEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((row, index) => (
            <li key={row.supplierId} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--admin-text)]">
                    {row.supplierName ?? t("admin.inventoryAnalytics.chart.unknownSupplier")}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatEgp(row.cost)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-primary)]"
                    style={{ width: `${(row.cost / max) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
