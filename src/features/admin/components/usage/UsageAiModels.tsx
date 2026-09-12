import type { AiUsageLine, AiUsageRollup } from "@/services/ai_usage/rollup";
import { formatUsageCount } from "@/services/platform_usage/metric";

type Props = {
  usage: AiUsageRollup;
  title: string;
  subtitle: string;
  requestsLabel: string;
  tokensLabel: string;
  idleLabel: string;
  activeLabel: string;
  limitedLabel: string;
  ofLabel: string;
  totalLabel: string;
  retiredLabel: string;
};

/**
 * Rendered as a fixed UTC time rather than the viewer's locale: this component
 * renders on the server and again on the client, and a locale-dependent clock
 * would disagree between the two.
 */
function atUtc(iso: string): string {
  return `${new Date(iso).toISOString().slice(11, 16)} UTC`;
}

function statusText(
  line: AiUsageLine,
  labels: { idle: string; active: string; limited: string },
): string {
  if (line.status === "rate_limited") {
    return line.lastRateLimitedAt
      ? `${labels.limited} · ${atUtc(line.lastRateLimitedAt)}`
      : labels.limited;
  }
  return line.status === "active" ? labels.active : labels.idle;
}

export function UsageAiModels({
  usage,
  title,
  subtitle,
  requestsLabel,
  tokensLabel,
  idleLabel,
  activeLabel,
  limitedLabel,
  ofLabel,
  totalLabel,
  retiredLabel,
}: Props) {
  return (
    <section className="admin-card rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h2>
        <p className="text-xs text-[var(--admin-muted)]">{subtitle}</p>
      </div>

      {/* Numbered, because the order is the point: this is the order the
          assistant asks them in, and what answers first carries the day. */}
      <ol className="mt-4 space-y-3">
        {usage.lines.map((line, index) => (
          <li key={line.id} className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 text-sm text-[var(--admin-text)]">
                <span className="text-[var(--admin-muted)]">{index + 1}. </span>
                <span className="font-medium">{line.model}</span>
                <span className="text-xs text-[var(--admin-muted)]"> · {line.provider}</span>
                {line.inChain ? null : (
                  <span className="text-xs text-[var(--admin-muted)]"> · {retiredLabel}</span>
                )}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  line.status === "rate_limited"
                    ? "bg-[var(--admin-danger-soft,var(--admin-hover))] text-[var(--admin-danger,var(--admin-text))]"
                    : "bg-[var(--admin-hover)] text-[var(--admin-muted)]"
                }`}
              >
                {statusText(line, {
                  idle: idleLabel,
                  active: activeLabel,
                  limited: limitedLabel,
                })}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 text-xs text-[var(--admin-muted)]">
              <span>
                {requestsLabel}: {formatUsageCount(line.requests)}
              </span>
              <span>
                {tokensLabel}: {formatUsageCount(line.tokens)}
                {line.capTokens === null
                  ? null
                  : ` ${ofLabel} ${formatUsageCount(line.capTokens)}`}
              </span>
            </div>

            {/* Only drawn where the provider publishes a daily cap; a bar with
                no ceiling behind it would imply a limit we do not know. */}
            {line.ratio === null ? null : (
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-[var(--admin-hover)]"
                role="img"
                aria-label={`${line.model}: ${Math.round(line.ratio * 100)}%`}
              >
                <div
                  className="h-full rounded-full bg-[var(--admin-text)]"
                  style={{ width: `${Math.round(line.ratio * 100)}%` }}
                />
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3">
        <span className="text-sm text-[var(--admin-text)]">{totalLabel}</span>
        <span className="text-sm font-semibold text-[var(--admin-text)]">
          {formatUsageCount(usage.totals.requests)} · {formatUsageCount(usage.totals.tokens)}
        </span>
      </div>
    </section>
  );
}
