"use client";

import type { DashboardKpi } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DashboardKpiCard } from "./DashboardKpiCard";

type Props = { items: DashboardKpi[] };

export function DashboardKpis({ items }: Props) {
  const t = useTranslations();
  return (
    <section className="relative">
      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-1",
          "snap-x snap-mandatory scroll-smooth",
          "[scrollbar-width:thin]",
        )}
        role="list"
        aria-label={t("admin.overview.kpiRow")}
      >
        {items.map((item, index) => (
          <div
            key={item.labelKey}
            role="listitem"
            className="w-[min(100%,17.5rem)] shrink-0 snap-start sm:w-[15.5rem]"
          >
            <DashboardKpiCard item={item} iconIndex={index} />
          </div>
        ))}
      </div>
    </section>
  );
}
