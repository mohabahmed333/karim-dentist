"use client";

import type { StorageUsageReport } from "@/services/storage/usage";
import { useTranslations } from "@/lib/i18n";

type Props = {
  report: StorageUsageReport;
};

export function StorageUsageCard({ report }: Props) {
  const t = useTranslations();
  const width = `${Math.max(2, Math.round(report.ratio * 100))}%`;
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#e6e8ec]">
      <div>
        <strong className="text-sm font-medium text-[#0f2744]">{t("admin.pages.storage.title")}</strong>
        <p className="mt-1 text-sm text-[#6b7280]">
          {t("admin.pages.storage.usedOf")
            .replace("{used}", report.usedLabel)
            .replace("{quota}", report.quotaLabel)}
        </p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-valuenow={Math.round(report.ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("admin.pages.storage.ariaLabel")}
      >
        <div
          className="h-full rounded-full bg-[#c9a962]"
          style={{ width }}
        />
      </div>
      <p className="mt-2 text-xs text-[#6b7280]">
        {t("admin.pages.storage.remaining")
          .replace("{remaining}", report.remainingLabel)
          .replace("{percent}", report.percentLabel)}
      </p>
    </div>
  );
}
