"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FeatureReadinessList } from "./FeatureReadinessList";
import { NotificationRootCauses } from "./NotificationRootCauses";
import { FeaturesSkeleton, RootCausesSkeleton } from "./NotificationStatusSkeleton";
import type { Readiness } from "./notificationReadinessTypes";

type Props = {
  readiness: Readiness | null;
  /** The first check, which shows skeletons. */
  checking: boolean;
  /** A re-check, which keeps the current results on screen. */
  refreshing: boolean;
  checkedAt: Date | null;
  onRefresh: () => void;
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
}: Props) {
  const features = readiness?.features ?? [];
  const queue = readiness ? queueSummary(readiness.queue) : "";

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[var(--admin-muted)]">
          {checking || refreshing
            ? "Checking…"
            : checkedAt
              ? `Checked ${timeOfDay(checkedAt)}`
              : "Not checked yet"}
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={checking || refreshing}
        >
          {refreshing ? "Checking…" : "Check again"}
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
          <FeatureReadinessList features={features} />
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-[var(--admin-muted)]">Could not check the status.</p>
          <Button type="button" size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? "Checking…" : "Try again"}
          </Button>
        </div>
      )}

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--admin-muted)]">
        {readiness?.requiredTemplates?.length ? (
          <span>
            Templates: <span className="font-mono">{readiness.requiredTemplates.join(" · ")}</span>
          </span>
        ) : null}
        {queue ? <span>Queue: {queue}</span> : null}
        <Link href="/admin/outbox" className="underline underline-offset-2 hover:text-[var(--admin-text,#1a1a1a)]">
          Patient messages →
        </Link>
      </p>
    </div>
  );
}
