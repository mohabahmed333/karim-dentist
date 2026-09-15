"use client";

import type { AnyMessageKey } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n";
import type { InventoryWeekConsumptionPoint } from "@/features/admin/lib/dashboardInventoryStats";
import type { CategoryStockValue } from "@/services/inventory/statsQueries";
import type { InventoryItemCategory } from "@/services/inventory/types";
import { CATEGORY_LABEL_KEYS } from "@/services/inventory/i18nMaps";

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

function categoryLabel(t: (key: AnyMessageKey) => string, category: string): string {
  const key = CATEGORY_LABEL_KEYS[category as InventoryItemCategory];
  return key ? t(key) : category;
}

export function ChartInventoryStockValue({
  stockValueByCategory,
}: {
  stockValueByCategory: CategoryStockValue[];
}) {
  const t = useTranslations();
  const rows = stockValueByCategory.slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.inventoryStockValue")}
      </h2>
      <p className="mb-4 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.inventoryStockValueDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--admin-muted)]">
          {t("admin.overview.chart.inventoryStockValueEmpty")}
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          {rows.map((item, index) => (
            <li key={item.category} className="flex items-center gap-3">
              <span className="w-4 shrink-0 text-xs tabular-nums text-[var(--admin-muted)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--admin-text)]">
                    {categoryLabel(t, item.category)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatEgp(item.value)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-hover)]">
                  <div
                    className="h-full rounded-full bg-[var(--admin-primary)]"
                    style={{ width: `${(item.value / max) * 100}%` }}
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

export function ChartInventoryConsumption({
  weekConsumption,
}: {
  weekConsumption: InventoryWeekConsumptionPoint[];
}) {
  const t = useTranslations();
  const max = Math.max(...weekConsumption.map((item) => item.amount), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.inventoryConsumption")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.inventoryConsumptionDesc")}
      </p>
      <div className="grid min-h-[12rem] min-w-0 flex-1 grid-cols-7 gap-2">
        {weekConsumption.map((item, index) => {
          const barPct = Math.max(
            item.amount === 0 ? 4 : 10,
            (item.amount / max) * 100,
          );
          return (
            <div
              key={`${item.label}-${index}`}
              className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto_auto] justify-items-center gap-1.5"
            >
              <div
                className="relative w-full min-h-0 self-stretch rounded-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-primary) 10%, white)",
                }}
              >
                <div className="absolute inset-x-1.5 bottom-1.5 top-2 flex items-end">
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: `${barPct}%`,
                      background: "var(--admin-primary)",
                      opacity: item.amount === 0 ? 0.25 : 1,
                    }}
                    title={formatEgp(item.amount)}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--admin-muted)]">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-[var(--admin-text)]">
                {formatEgp(item.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
