"use client";

import type { AdminMessageKey } from "@/lib/i18n";
import { useTranslations } from "@/lib/i18n";
import type { PlatformUsageData } from "@/services/platform_usage/load";
import type { UsageMetricId } from "@/services/platform_usage/metric";
import { UsageAiModels } from "./UsageAiModels";
import { UsageApiCounts } from "./UsageApiCounts";
import { UsageMetricCard } from "./UsageMetricCard";

type Props = { data: PlatformUsageData };

const TITLE_KEYS: Record<UsageMetricId, AdminMessageKey> = {
  storage: "admin.usage.storage",
  database: "admin.usage.database",
  egress: "admin.usage.egress",
  authMau: "admin.usage.authMau",
  kapsoMessages: "admin.usage.whatsapp",
  vercelFastDataTransfer: "admin.usage.vercelTransfer",
  vercelEdgeRequests: "admin.usage.vercelEdgeRequests",
  vercelFunctionInvocations: "admin.usage.vercelInvocations",
};

export function UsageDashboard({ data }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-4">
      {data.hasAccessToken ? null : (
        <p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 text-sm text-[var(--admin-muted)]">
          {t("admin.usage.needsToken")}
        </p>
      )}
      {data.hasVercelToken ? null : (
        <p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 text-sm text-[var(--admin-muted)]">
          {t("admin.usage.needsVercelToken")}
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => (
          <UsageMetricCard
            key={metric.id}
            metric={metric}
            title={t(
              metric.id === "authMau" && data.authSource === "users"
                ? "admin.usage.authUsers"
                : TITLE_KEYS[metric.id],
            )}
            usedLabel={t("admin.usage.used")}
            remainingLabel={t("admin.usage.remaining")}
            unavailableLabel={t("admin.usage.unavailable")}
            planLabel={t("admin.usage.planFree")}
          />
        ))}
      </div>
      {data.aiUsage ? (
        <UsageAiModels
          usage={data.aiUsage}
          title={t("admin.usage.aiTitle")}
          subtitle={t("admin.usage.aiSubtitle")}
          requestsLabel={t("admin.usage.aiRequests")}
          tokensLabel={t("admin.usage.aiTokens")}
          idleLabel={t("admin.usage.aiIdle")}
          activeLabel={t("admin.usage.aiActive")}
          limitedLabel={t("admin.usage.aiLimited")}
          ofLabel={t("admin.usage.aiOf")}
          totalLabel={t("admin.usage.aiTotal")}
          retiredLabel={t("admin.usage.aiRetired")}
        />
      ) : (
        <p className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2 text-sm text-[var(--admin-muted)]">
          {t("admin.usage.aiUnavailable")}
        </p>
      )}
      {data.apiCounts ? (
        <UsageApiCounts
          counts={data.apiCounts}
          title={t("admin.usage.apiRequests")}
          authLabel={t("admin.usage.apiAuth")}
          restLabel={t("admin.usage.apiRest")}
          storageLabel={t("admin.usage.storage")}
          realtimeLabel={t("admin.usage.apiRealtime")}
          totalLabel={t("admin.usage.apiTotal")}
        />
      ) : null}
    </div>
  );
}
