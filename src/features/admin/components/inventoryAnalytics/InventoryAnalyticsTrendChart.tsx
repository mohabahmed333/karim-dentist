"use client";

import type { ConsumptionTrendPoint } from "@/features/admin/lib/inventoryAnalyticsStats";
import { useTranslations } from "@/lib/i18n";

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

export function ChartConsumptionTrend({
  trend,
}: {
  trend: ConsumptionTrendPoint[];
}) {
  const t = useTranslations();
  const max = Math.max(...trend.map((item) => item.amount), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.consumptionTrend")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.consumptionTrendDesc")}
      </p>
      <div className="flex min-h-[12rem] min-w-0 flex-1 items-end gap-px overflow-x-auto">
        {trend.map((item, index) => (
          <div
            key={`${item.label}-${index}`}
            className="relative h-full min-w-[3px] flex-1"
            title={`${item.label}: ${formatEgp(item.amount)}`}
          >
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-end">
              <div
                className="w-full min-h-0.5 rounded-t-sm"
                style={{
                  height: `${Math.max(item.amount === 0 ? 2 : 6, (item.amount / max) * 100)}%`,
                  background: "var(--admin-primary)",
                  opacity: item.amount === 0 ? 0.2 : 1,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex shrink-0 justify-between text-[10px] text-[var(--admin-muted)]">
        <span>{trend[0]?.label}</span>
        <span>{trend[trend.length - 1]?.label}</span>
      </div>
    </section>
  );
}
