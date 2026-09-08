import { formatUsageCount } from "@/services/platform_usage/metric";
import type { ApiCountTotals } from "@/services/platform_usage/parse";

type Props = {
  counts: ApiCountTotals;
  title: string;
  authLabel: string;
  restLabel: string;
  storageLabel: string;
  realtimeLabel: string;
  totalLabel: string;
};

export function UsageApiCounts({
  counts,
  title,
  authLabel,
  restLabel,
  storageLabel,
  realtimeLabel,
  totalLabel,
}: Props) {
  const rows = [
    [authLabel, counts.auth],
    [restLabel, counts.rest],
    [storageLabel, counts.storage],
    [realtimeLabel, counts.realtime],
    [totalLabel, counts.total],
  ] as const;

  return (
    <section className="admin-card rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">{totalLabel}</p>
      <ul className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <li key={label} className="flex items-center justify-between gap-3">
            <span className="text-sm text-[var(--admin-text)]">{label}</span>
            <span className="text-sm font-semibold text-[var(--admin-text)]">
              {formatUsageCount(value)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
