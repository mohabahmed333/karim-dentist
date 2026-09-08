import type { UsageMetric } from "@/services/platform_usage/metric";
import { UsageDonut } from "./UsageDonut";

type Props = {
  metric: UsageMetric;
  title: string;
  usedLabel: string;
  remainingLabel: string;
  unavailableLabel: string;
  planLabel: string;
};

export function UsageMetricCard({
  metric,
  title,
  usedLabel,
  remainingLabel,
  unavailableLabel,
  planLabel,
}: Props) {
  const unavailable = metric.status === "unavailable";
  const chartLabel = unavailable
    ? `${title}: ${unavailableLabel}`
    : `${title}: ${metric.percentLabel} ${usedLabel}`;

  return (
    <article className="admin-card flex flex-col gap-4 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--admin-text)]">
            {title}
          </h2>
          <p className="mt-1 text-xs text-[var(--admin-muted)]">
            {unavailable
              ? unavailableLabel
              : `${metric.usedLabel} / ${metric.quotaLabel}`}
          </p>
        </div>
        <span className="rounded-full bg-[var(--admin-hover)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[var(--admin-muted)]">
          {planLabel}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <UsageDonut
          ratio={metric.ratio}
          label={chartLabel}
          unavailable={unavailable}
        />
        <dl className="min-w-0 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-[var(--admin-muted)]">{usedLabel}</dt>
            <dd className="font-semibold text-[var(--admin-text)]">
              {unavailable ? "—" : metric.usedLabel}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--admin-muted)]">
              {remainingLabel}
            </dt>
            <dd className="font-semibold text-[var(--admin-text)]">
              {unavailable ? "—" : metric.remainingLabel}
            </dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
