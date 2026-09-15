"use client";

import type { WastageByReason } from "@/services/inventory/statsQueries";
import type { WastageReasonCode } from "@/services/inventory/types";
import { REASON_LABEL_KEYS } from "@/services/inventory/i18nMaps";
import { useTranslations } from "@/lib/i18n";
import type { AnyMessageKey } from "@/lib/i18n";

// Same dataviz-skill-validated 6-hue order already used for Overview's
// payment-method-mix chart (references/palette.md, slots 1-6) — a different
// semantic domain, never on screen at the same time as that chart.
const REASON_ORDER = [
  "dropped_contaminated",
  "expired",
  "damaged_packaging",
  "patient_no_show_opened",
  "equipment_failure",
  "other",
] as const;

const REASON_COLOR: Record<string, string> = {
  dropped_contaminated: "#2a78d6",
  expired: "#eb6834",
  damaged_packaging: "#1baf7a",
  patient_no_show_opened: "#eda100",
  equipment_failure: "#e87ba4",
  other: "#008300",
};

function reasonLabel(t: (key: AnyMessageKey) => string, reasonCode: string): string {
  const key = REASON_LABEL_KEYS[reasonCode as WastageReasonCode];
  return key ? t(key) : t("admin.pages.inventory.reason.other");
}

function reasonColor(reasonCode: string): string {
  return REASON_COLOR[reasonCode] ?? REASON_COLOR.other!;
}

function formatEgp(value: number): string {
  return `${Math.round(value).toLocaleString()} EGP`;
}

function conicGradient(rows: WastageByReason[], total: number): string {
  let cursor = 0;
  const stops: string[] = [];
  for (const row of rows) {
    const start = cursor;
    cursor += (row.cost / total) * 360;
    stops.push(`${reasonColor(row.reasonCode)} ${start.toFixed(1)}deg ${cursor.toFixed(1)}deg`);
  }
  if (stops.length === 0) return "#ECEEF3";
  return `conic-gradient(${stops.join(", ")})`;
}

export function ChartWastageByReason({
  wastage,
}: {
  wastage: WastageByReason[];
}) {
  const t = useTranslations();
  // Fixed order for identity, top 5 plus an "other" catch-all beyond that —
  // never a generated 7th+ hue.
  const ordered = REASON_ORDER
    .map((code) => wastage.find((w) => w.reasonCode === code))
    .filter((row): row is WastageByReason => row != null && row.cost > 0);
  const extra = wastage.filter((w) => !REASON_ORDER.includes(w.reasonCode as (typeof REASON_ORDER)[number]));
  const extraTotal = extra.reduce((sum, row) => sum + row.cost, 0);
  const rows = extraTotal > 0
    ? [...ordered.filter((r) => r.reasonCode !== "other"), { reasonCode: "other", cost: (ordered.find((r) => r.reasonCode === "other")?.cost ?? 0) + extraTotal }]
    : ordered;
  const total = rows.reduce((sum, row) => sum + row.cost, 0) || 1;

  return (
    <section className="admin-card h-full min-h-0 overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <h2 className="text-sm font-semibold text-[var(--admin-text)]">
        {t("admin.inventoryAnalytics.chart.wastageByReason")}
      </h2>
      <p className="mt-1 text-xs text-[var(--admin-muted)]">
        {t("admin.inventoryAnalytics.chart.wastageByReasonDesc")}
      </p>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--admin-muted)]">
          {t("admin.inventoryAnalytics.chart.wastageByReasonEmpty")}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div
            className="mx-auto size-36 shrink-0 rounded-full"
            style={{ background: conicGradient(rows, total) }}
            role="img"
            aria-label={t("admin.inventoryAnalytics.chart.wastageByReason")}
          />
          <ul className="min-w-0 flex-1 space-y-2.5">
            {rows.map((row) => (
              <li key={row.reasonCode} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: reasonColor(row.reasonCode) }}
                  />
                  <span className="truncate text-[var(--admin-text)]">
                    {reasonLabel(t, row.reasonCode)}
                  </span>
                </span>
                <span className="shrink-0 font-semibold text-[var(--admin-text)]">
                  {formatEgp(row.cost)}
                  <span className="ms-1 font-normal text-[var(--admin-muted)]">
                    ({Math.round((row.cost / total) * 100)}%)
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
