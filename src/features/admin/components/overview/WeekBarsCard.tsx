import type { ReservationStats } from "@/services/reservations/stats";

type Props = {
  weekCounts: ReservationStats["weekCounts"];
};

export function WeekBarsCard({ weekCounts }: Props) {
  const max = Math.max(...weekCounts.map((item) => item.count), 1);

  return (
    <section className="rounded-3xl bg-[var(--admin-panel)] p-6 shadow-sm ring-1 ring-[#e6e8ec]">
      <h2 className="mb-4 text-sm font-semibold text-[#0f2744]">This week</h2>
      <div className="flex items-end gap-2">
        {weekCounts.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-28 w-full items-end rounded-2xl bg-[var(--admin-canvas)] p-2">
              <div
                className="w-full rounded-xl bg-[#c9a962]"
                style={{ height: `${Math.max(8, (item.count / max) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-[#6b7280]">{item.label}</span>
            <span className="text-xs font-medium text-[#0f2744]">{item.count}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
