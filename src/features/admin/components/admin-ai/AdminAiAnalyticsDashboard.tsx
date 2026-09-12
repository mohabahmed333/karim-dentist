"use client";

import type { AdminAiAnalytics } from "@/services/admin_ai/loadAdminAiAnalytics";
import { actionKindLabel } from "@/services/admin_ai/actionKindLabels";
import { useLocale, useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n";

type Props = {
  data: AdminAiAnalytics;
};

const OUTCOME_LABEL_KEYS = {
  proposed: "admin.aiAnalytics.outcome.proposed",
  confirmed: "admin.aiAnalytics.outcome.confirmed",
  cancelled: "admin.aiAnalytics.outcome.cancelled",
  failed: "admin.aiAnalytics.outcome.failed",
  stale: "admin.aiAnalytics.outcome.stale",
} as const satisfies Record<string, AdminMessageKey>;

/** Tiles a doctor would want reassurance from get the muted, ink-only treatment; only "failed" needs a flag. */
const OUTCOME_TONE: Record<keyof typeof OUTCOME_LABEL_KEYS, string> = {
  proposed: "text-[var(--admin-muted)]",
  confirmed: "text-[var(--admin-text)]",
  cancelled: "text-[var(--admin-muted)]",
  failed: "text-red-700",
  stale: "text-[var(--admin-muted)]",
};

function StatTile({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3">
      <p className="text-xs text-[var(--admin-muted)]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${tone ?? "text-[var(--admin-text)]"}`}>
        {value}
      </p>
    </div>
  );
}

export function AdminAiAnalyticsDashboard({ data }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  return (
    <div className="space-y-4">
      <p className="text-xs text-[var(--admin-muted)]">
        {t("admin.aiAnalytics.window").replace("{days}", String(data.windowDays))}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {(Object.keys(OUTCOME_LABEL_KEYS) as (keyof typeof OUTCOME_LABEL_KEYS)[]).map((key) => (
          <StatTile
            key={key}
            label={t(OUTCOME_LABEL_KEYS[key])}
            value={data.outcomeCounts[key]}
            tone={OUTCOME_TONE[key]}
          />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">
            {t("admin.aiAnalytics.feedbackTitle")}
          </h2>
          {data.feedbackRatePercent === null ? (
            <p className="mt-2 text-sm text-[var(--admin-muted)]">
              {t("admin.aiAnalytics.feedbackNone")}
            </p>
          ) : (
            <>
              <p className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">
                {data.feedbackRatePercent}%
              </p>
              <p className="mt-1 text-xs text-[var(--admin-muted)]">
                {t("admin.aiAnalytics.feedbackDetail")
                  .replace("{up}", String(data.feedbackUp))
                  .replace("{down}", String(data.feedbackDown))}
              </p>
            </>
          )}
        </article>

        <article className="rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">
            {t("admin.aiAnalytics.topFailingTitle")}
          </h2>
          {data.topFailingKinds.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--admin-muted)]">
              {t("admin.aiAnalytics.topFailingNone")}
            </p>
          ) : (
            <ol className="mt-2 space-y-1.5 text-sm">
              {data.topFailingKinds.map((row) => (
                <li key={row.kind} className="flex items-center justify-between gap-2">
                  <span className="truncate text-[var(--admin-text)]">
                    {actionKindLabel(row.kind, locale)}
                  </span>
                  <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    {row.count}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </article>
      </div>
    </div>
  );
}
