"use client";

import {
  CalendarDays,
  CircleCheck,
  Clock3,
  Layers,
} from "lucide-react";
import type { DashboardKpi } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

const ICONS = [
  { Icon: CalendarDays, wrap: "bg-[#0F766E]" },
  { Icon: Clock3, wrap: "bg-[#EA580C]" },
  { Icon: CircleCheck, wrap: "bg-[var(--admin-secondary)]" },
  { Icon: Layers, wrap: "bg-[#7C3AED]" },
] as const;

type Props = {
  item: DashboardKpi;
  iconIndex?: number;
};

export function DashboardKpiCard({ item, iconIndex = 0 }: Props) {
  const t = useTranslations();
  const { Icon, wrap } = ICONS[iconIndex % ICONS.length]!;
  const label = t(item.labelKey);
  return (
    <article className="admin-card flex h-auto min-h-[5.5rem] items-center gap-3 self-start rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--admin-muted)]">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
          {item.value}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <p
          className={`text-[11px] font-medium ${
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
}
