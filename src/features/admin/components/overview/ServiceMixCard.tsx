import type { ReservationStats } from "@/services/reservations/stats";

type Props = {
  serviceMix: ReservationStats["serviceMix"];
};

export function ServiceMixCard({ serviceMix }: Props) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-[#e6e8ec]">
      <h2 className="mb-4 text-sm font-semibold text-[#0f2744]">By service</h2>
      {serviceMix.length === 0 ? (
        <p className="text-sm text-[#6b7280]">No bookings yet.</p>
      ) : (
        <ul className="space-y-3">
          {serviceMix.map((item) => (
            <li key={item.label}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-[#0f2744]">{item.label}</span>
                <span className="text-[#6b7280]">{item.percent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#0f2744]"
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
