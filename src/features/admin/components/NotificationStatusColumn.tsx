"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureReadinessList } from "./FeatureReadinessList";
import { NotificationRootCauses } from "./NotificationRootCauses";
import { FeaturesSkeleton, RootCausesSkeleton } from "./NotificationStatusSkeleton";
import type { Readiness } from "./notificationReadinessTypes";
import { useTranslations } from "@/lib/i18n";

type Props = {
  readiness: Readiness | null;
  /** The first check, which shows skeletons. */
  checking: boolean;
  /** A re-check, which keeps the current results on screen. */
  refreshing: boolean;
  checkedAt: Date | null;
  onRefresh: () => void;
  /** Flip a feature's own switch, then re-check so the row reflects it. */
  onToggleFeature?: (key: string, enabled: boolean) => Promise<void>;
};

/** "14:05" — when the status was last checked, in the viewer's own clock format. */
function timeOfDay(at: Date): string {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(at);
}

/** "pending 3 · sent 12 · skipped 4", from the readiness queue counts. */
function queueSummary(queue: Record<string, number>): string {
  const totals = new Map<string, number>();
  for (const [key, count] of Object.entries(queue)) {
    const status = key.split(":")[0];
    totals.set(status, (totals.get(status) ?? 0) + count);
  }
  return [...totals.entries()].map(([status, n]) => `${status} ${n}`).join(" · ");
}

/**
 * What is blocking each feature, and when that was last checked.
 *
 * Conditions are fixed outside this screen — a migration applied, a template
 * approved in Meta — so the answer goes stale while the tab sits open. Hence the
 * check again button, and the time beside it saying how old the answer is.
 */
export function NotificationStatusColumn({
  readiness,
  checking,
  refreshing,
  checkedAt,
  onRefresh,
  onToggleFeature,
}: Props) {
  const t = useTranslations();
  const features = readiness?.features ?? [];
  const queue = readiness ? queueSummary(readiness.queue) : "";

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--admin-muted)]">
          {checking || refreshing
            ? t("admin.notifications.checking")
            : checkedAt
              ? t("admin.notifications.checkedAt").replace(
                  "{time}",
                  timeOfDay(checkedAt),
                )
              : t("admin.notifications.notCheckedYet")}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={checking || refreshing}
        >
          {refreshing ? t("admin.notifications.checking") : t("admin.notifications.checkAgain")}
        </Button>
      </div>

      {checking ? (
        <>
          <RootCausesSkeleton />
          <FeaturesSkeleton />
        </>
      ) : features.length ? (
        <>
          <NotificationRootCauses features={features} />
          <FeatureReadinessList features={features} onToggle={onToggleFeature} />
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[var(--admin-muted)]">{t("admin.notifications.statusCheckFailed")}</p>
          <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? t("admin.notifications.checking") : t("admin.notifications.tryAgain")}
          </Button>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--admin-muted)]">
        {readiness?.requiredTemplates?.length ? (
          <span>
            {t("admin.notifications.templatesLabel")}{" "}
            <span className="font-mono">{readiness.requiredTemplates.join(" · ")}</span>
          </span>
        ) : null}
        {queue ? (
          <span>{t("admin.notifications.queueLabel").replace("{queue}", queue)}</span>
        ) : null}
        <Link href="/admin/outbox" className="underline underline-offset-2 hover:text-[var(--admin-text,#1a1a1a)]">
          {t("admin.notifications.patientMessagesLink")}
        </Link>
      </p>
    </div>
  );
}
