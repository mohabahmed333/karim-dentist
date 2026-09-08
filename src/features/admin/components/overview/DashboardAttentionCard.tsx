"use client";

import Link from "next/link";
import { Calendar, MessageSquare } from "lucide-react";
import type { AttentionItem } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

const toneIcon = {
  blue: {
    Icon: Calendar,
    wrap: "bg-[var(--admin-secondary)] text-white",
  },
  orange: { Icon: MessageSquare, wrap: "bg-[#EA580C] text-white" },
  violet: { Icon: MessageSquare, wrap: "bg-[#7C3AED] text-white" },
} as const;

type Props = {
  item: AttentionItem | null;
  /** Shown in customize when the metric has no data yet. */
  emptyLabel: string;
};

export function DashboardAttentionCard({ item, emptyLabel }: Props) {
  const t = useTranslations();
  if (!item) {
    return (
      <div className="admin-card flex min-h-[5.5rem] items-center rounded-md border border-dashed border-[var(--admin-border)] bg-[var(--admin-panel)] p-3 text-sm text-[var(--admin-muted)]">
        {emptyLabel}
      </div>
    );
  }
  const { Icon, wrap } = toneIcon[item.tone];
  return (
    <Link
      href={item.href}
      className="admin-card flex h-auto min-h-[5.5rem] items-center gap-3 self-start rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--admin-muted)]">
          {t(item.titleKey)}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
          {item.detail}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="text-[11px] font-medium text-[#DC2626]">
          {item.urgency}
        </span>
        <span
          className={`inline-flex size-8 items-center justify-center rounded-lg ${wrap}`}
        >
          <Icon className="size-4" />
        </span>
      </div>
    </Link>
  );
}
