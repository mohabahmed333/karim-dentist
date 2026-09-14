"use client";

import { Wallet } from "lucide-react";
import type { DoctorProduction } from "@/services/patient_treatments/queries";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale, useTranslations } from "@/lib/i18n";

type Props = {
  production: DoctorProduction | null;
};

export function DashboardDoctorProductionCard({ production }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const total = production?.total ?? 0;
  const completedCount = production?.completedCount ?? 0;

  return (
    <article className="admin-card flex h-auto min-h-[5.5rem] items-center gap-3 self-start rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-[var(--admin-muted)]">
          {t("admin.overview.widget.myProductionWeek")}
        </p>
        <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--admin-text)]">
          {formatEgp(total, locale)}
        </p>
        <p className="mt-0.5 text-[11px] text-[var(--admin-muted)]">
          {completedCount} {t("admin.overview.myProductionWeekCompleted")}
        </p>
      </div>
      <span className="flex shrink-0 items-center justify-center rounded-lg bg-[var(--admin-secondary)] p-2 text-white">
        <Wallet className="size-4" />
      </span>
    </article>
  );
}
