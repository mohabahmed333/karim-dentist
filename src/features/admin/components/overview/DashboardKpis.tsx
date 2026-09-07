"use client";

import {
  CalendarDays,
  CircleCheck,
  Clock3,
  Layers,
  MoreVertical,
} from "lucide-react";
import type { DashboardKpi } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

type Props = { items: DashboardKpi[] };

const iconFor = [
  { Icon: CalendarDays, wrap: "bg-[#0F766E]" },
  { Icon: Clock3, wrap: "bg-[#EA580C]" },
  { Icon: CircleCheck, wrap: "bg-[var(--admin-secondary)]" },
  { Icon: Layers, wrap: "bg-[#7C3AED]" },
] as const;

export function DashboardKpis({ items }: Props) {
  const t = useTranslations();
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => {
        const { Icon, wrap } = iconFor[index % iconFor.length]!;
        const label = t(item.labelKey);
        return (
          <article
            key={item.labelKey}
            className="admin-card relative rounded-md border border-[var(--admin-border)] bg-white p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-[var(--admin-muted)]">{label}</p>
              <button
                type="button"
                className="rounded-md p-0.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[#4B5563]"
                aria-label={label}
              >
                <MoreVertical className="size-4" />
              </button>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-[var(--admin-text)]">
              {item.value}
            </p>
            <div className="mt-4 flex items-end justify-between gap-2">
              <p
                className={`text-xs font-medium ${
                  item.up ? "text-[#16A34A]" : "text-[#DC2626]"
                }`}
              >
                {item.trend}
              </p>
              <span
                className={`inline-flex size-8 items-center justify-center rounded-lg text-white ${wrap}`}
              >
                <Icon className="size-4" />
              </span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
