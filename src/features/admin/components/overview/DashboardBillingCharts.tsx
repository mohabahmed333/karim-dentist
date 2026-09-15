"use client";

import type {
  PaymentMethodMixItem,
  WeekRevenuePoint,
} from "@/features/admin/lib/dashboardBillingStats";
import { useTranslations } from "@/lib/i18n";
import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

// Fixed categorical order, dataviz-skill-validated (adjacent CVD pass, light+dark):
// blue, orange, aqua, yellow, magenta, green (slots 1-6 of the documented 8-hue default).
const METHOD_COLOR: Record<string, string> = {
  cash: "#2a78d6",
  card: "#eb6834",
  instapay: "#1baf7a",
  deposit: "#eda100",
  whatsapp: "#e87ba4",
  other: "#008300",
};

const METHOD_LABEL: Record<string, AdminMessageKey> = {
  cash: "admin.overview.chart.method.cash",
  card: "admin.overview.chart.method.card",
  instapay: "admin.overview.chart.method.instapay",
  deposit: "admin.overview.chart.method.deposit",
  whatsapp: "admin.overview.chart.method.whatsapp",
  other: "admin.overview.chart.method.other",
};

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

export function ChartBillingRevenue({
  weekRevenue,
}: {
  weekRevenue: WeekRevenuePoint[];
}) {
  const t = useTranslations();
  const max = Math.max(...weekRevenue.map((item) => item.amount), 1);

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="mb-1 shrink-0 text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.billingRevenue")}
      </h2>
      <p className="mb-3 shrink-0 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.billingRevenueDesc")}
      </p>
      <div className="grid min-h-[12rem] min-w-0 flex-1 grid-cols-7 gap-2">
        {weekRevenue.map((item, index) => {
          const barPct = Math.max(
            item.amount === 0 ? 4 : 10,
            (item.amount / max) * 100,
          );
          return (
            <div
              key={`${item.label}-${index}`}
              className="grid min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_auto_auto] justify-items-center gap-1.5"
            >
              <div
                className="relative w-full min-h-0 self-stretch rounded-md"
                style={{
                  background:
                    "color-mix(in srgb, var(--admin-secondary) 12%, white)",
                }}
              >
                <div className="absolute inset-x-1.5 bottom-1.5 top-2 flex items-end">
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: `${barPct}%`,
                      background:
                        "linear-gradient(to top, color-mix(in srgb, var(--admin-secondary) 45%, white), var(--admin-secondary))",
                    }}
                    title={formatEgp(item.amount)}
                  />
                </div>
              </div>
              <span className="text-[10px] text-[var(--admin-muted)]">
                {item.label}
              </span>
              <span className="text-xs font-semibold text-[var(--admin-text)]">
                {formatEgp(item.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ChartBillingMethodMix({
  methodMix,
}: {
  methodMix: PaymentMethodMixItem[];
}) {
  const t = useTranslations();
  const total = methodMix.reduce((sum, item) => sum + item.amount, 0) || 1;

  return (
    <section className="admin-card h-full min-h-0 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.overview.chart.billingMethodMix")}
      </h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {t("admin.overview.chart.billingMethodMixDesc")}
      </p>
      {methodMix.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--admin-muted)]">
          {t("admin.overview.chart.billingMethodMixEmpty")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="mx-auto size-36 shrink-0 rounded-full"
            style={{ background: conicGradient(methodMix, total) }}
            role="img"
            aria-label={t("admin.overview.chart.billingMethodMix")}
          />
          <ul className="min-w-0 flex-1 space-y-2.5">
            {methodMix.map((item) => (
              <li
                key={item.method}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{
                      background: METHOD_COLOR[item.method] ?? METHOD_COLOR.other,
                    }}
                  />
                  <span className="truncate text-[var(--admin-text)]">
                    {t(METHOD_LABEL[item.method] ?? METHOD_LABEL.other!)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--admin-text)]">
                  {formatEgp(item.amount)}
                  <span className="ms-1 font-normal text-[var(--admin-muted)]">
                    ({item.percent}%)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function conicGradient(
  methodMix: PaymentMethodMixItem[],
  total: number,
): string {
  let cursor = 0;
  const stops: string[] = [];
  for (const item of methodMix) {
    const start = cursor;
    cursor += (item.amount / total) * 360;
    const color = METHOD_COLOR[item.method] ?? METHOD_COLOR.other;
    stops.push(`${color} ${start.toFixed(1)}deg ${cursor.toFixed(1)}deg`);
  }
  if (stops.length === 0) return "#ECEEF3";
  return `conic-gradient(${stops.join(", ")})`;
}
