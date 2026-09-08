"use client";

import type { ReservationStats } from "@/services/reservations/stats";
import { useQuickBook } from "@/features/admin/components/quick-book/QuickBookContext";

type Props = {
  stats: ReservationStats;
};

export function OverviewHeroCard({ stats }: Props) {
  const { openQuickBook } = useQuickBook();
  const delta = stats.todayCount - stats.yesterdayCount;
  const deltaLabel =
    delta === 0 ? "Same as yesterday" : `${delta > 0 ? "+" : ""}${delta} vs yesterday`;

  return (
    <section className="rounded-3xl bg-[var(--admin-panel)] p-6 shadow-sm ring-1 ring-[#e6e8ec] lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#6b7280]">Today&apos;s appointments</p>
          <p className="mt-1 text-4xl font-semibold text-[#0f2744]">
            {stats.todayCount}
          </p>
          <span className="mt-2 inline-flex rounded-full bg-[#c9a962]/15 px-3 py-1 text-xs font-medium text-[#0f2744]">
            {deltaLabel}
          </span>
        </div>
        <button
          type="button"
          onClick={() => openQuickBook()}
          className="rounded-full bg-[#c9a962] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8984f]"
        >
          Add reservation
        </button>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Pending", value: stats.pendingCount },
          { label: "Confirmed this week", value: stats.confirmedThisWeek },
          { label: "Cancelled", value: stats.cancelledCount },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-[var(--admin-panel)] px-4 py-3">
            <p className="text-xs text-[#6b7280]">{item.label}</p>
            <p className="text-xl font-semibold text-[#0f2744]">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
