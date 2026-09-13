import { CalendarDays, CircleCheck, Clock3 } from "lucide-react";

const NAV_ITEMS = ["Overview", "Reservations", "Patients", "Support", "Messaging"];

const KPIS = [
  { label: "Today's reservations", value: "18", trend: "+12%", up: true, Icon: CalendarDays, wrap: "bg-[#0F766E]" },
  { label: "Open conversations", value: "6", trend: "-8%", up: false, Icon: Clock3, wrap: "bg-[#EA580C]" },
  { label: "Avg. reply time", value: "3m", trend: "+4%", up: true, Icon: CircleCheck, wrap: "bg-[#5e6ad2]" },
];

const RESERVATIONS = [
  { name: "Sara Adel", detail: "Cleaning · 10:30 AM", status: "confirmed" },
  { name: "Omar Khaled", detail: "Filling · 11:15 AM", status: "pending" },
  { name: "Nour Hassan", detail: "Check-up · 1:00 PM", status: "confirmed" },
];

const STATUS_CLASS: Record<string, string> = {
  confirmed: "bg-[#DCFCE7] text-[#16A34A]",
  pending: "bg-[#FEF3C7] text-[#B45309]",
};

/**
 * Purely illustrative — plain HTML/CSS, no real data or generated image.
 * Mirrors the real admin dashboard's own visual language (DashboardKpiCard,
 * UpcomingReservationsCard) so this reads as this product's actual design,
 * not a generic stock mockup.
 */
export function AuthDashboardMockup() {
  return (
    <div
      className="pointer-events-none select-none"
      style={{ perspective: "1600px" }}
      aria-hidden="true"
    >
      <div
        className="overflow-hidden rounded-2xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.35)] ring-1 ring-black/5"
        style={{
          transform: "rotate3d(0.4, -1, 0, 18deg) rotate(-2deg)",
          transformOrigin: "left center",
        }}
      >
        <div className="flex">
          <div className="w-32 shrink-0 border-e border-black/5 bg-[#f7f8f8] p-3">
            <div className="mb-3 h-3 w-16 rounded-full bg-[#5e6ad2]/70" />
            {NAV_ITEMS.map((item, index) => (
              <div
                key={item}
                className={`mb-1.5 truncate rounded-md px-2 py-1.5 text-[10px] font-medium ${
                  index === 0 ? "bg-[#5e6ad2]/10 text-[#5e6ad2]" : "text-neutral-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4">
            <div className="mb-3 h-2.5 w-24 rounded-full bg-neutral-200" />
            <div className="grid grid-cols-3 gap-2">
              {KPIS.map(({ label, value, trend, up, Icon, wrap }) => (
                <article
                  key={label}
                  className="flex min-h-[4.5rem] flex-col justify-between rounded-lg border border-black/5 bg-[#f7f8f8] p-2.5"
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-neutral-800">
                        {value}
                      </p>
                      <p className="truncate text-[9px] leading-tight text-neutral-500">
                        {label}
                      </p>
                    </div>
                    <span
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-md text-white ${wrap}`}
                    >
                      <Icon className="size-2.5" />
                    </span>
                  </div>
                  <p
                    className={`text-[9px] font-medium ${up ? "text-[#16A34A]" : "text-[#DC2626]"}`}
                  >
                    {trend}
                  </p>
                </article>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {RESERVATIONS.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center gap-2 rounded-lg border border-black/5 p-2"
                >
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#5e6ad2]/10 text-[9px] font-semibold text-[#5e6ad2]">
                    {row.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium text-neutral-800">
                      {row.name}
                    </p>
                    <p className="truncate text-[9px] text-neutral-500">
                      {row.detail}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-medium capitalize ${STATUS_CLASS[row.status]}`}
                  >
                    {row.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
