"use client";

import Link from "next/link";
import { Calendar, Mail, MessageSquare } from "lucide-react";
import type { AttentionItem } from "@/features/admin/lib/dashboardModel";
import { useTranslations } from "@/lib/i18n";

const toneIcon = {
  blue: {
    Icon: Calendar,
    wrap: "bg-[color-mix(in_srgb,var(--admin-secondary)_14%,white)] text-[var(--admin-secondary)]",
  },
  orange: { Icon: MessageSquare, wrap: "bg-[#FFF1E7] text-[#EA580C]" },
  violet: { Icon: Mail, wrap: "bg-[#F3E8FF] text-[#7C3AED]" },
} as const;

type Props = { items: AttentionItem[] };

export function DashboardAttention({ items }: Props) {
  const t = useTranslations();
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">
          {t("admin.overview.needsAttention")}
        </h2>
        <span className="rounded-full bg-[#E5E7EB] px-2 py-0.5 text-xs font-medium text-[#4B5563]">
          {items.length}
        </span>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => {
          const { Icon, wrap } = toneIcon[item.tone];
          return (
            <Link
              key={item.id}
              href={item.href}
              className="admin-card rounded-md border border-[var(--admin-border)] bg-white p-3.5 transition hover:border-[var(--admin-border)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`inline-flex size-9 items-center justify-center rounded-md ${wrap}`}
                >
                  <Icon className="size-4" />
                </span>
                <span className="text-xs font-medium text-[#DC2626]">
                  {item.urgency}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--admin-text)]">
                {t(item.titleKey)}
              </p>
              <p className="mt-1 text-sm text-[var(--admin-muted)]">{item.detail}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
