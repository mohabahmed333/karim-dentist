"use client";

import { useTranslations } from "@/lib/i18n";
import type { AttentionItem } from "@/features/admin/lib/dashboardModel";
import { cn } from "@/lib/utils";
import { DashboardAttentionCard } from "./DashboardAttentionCard";

type Props = { items: AttentionItem[] };

export function DashboardAttention({ items }: Props) {
  const t = useTranslations();
  if (!items.length) return null;

  return (
    <section className="relative">
      <div
        className={cn(
          "flex gap-3 overflow-x-auto pb-1",
          "snap-x snap-mandatory scroll-smooth",
          "[scrollbar-width:thin]",
        )}
        role="list"
        aria-label={t("admin.overview.needsAttention")}
      >
        {items.map((item) => (
          <div
            key={item.id}
            role="listitem"
            className="w-[min(100%,17.5rem)] shrink-0 snap-start sm:w-[15.5rem]"
          >
            <DashboardAttentionCard
              item={item}
              emptyLabel={t("admin.overview.customize.cardEmpty")}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
