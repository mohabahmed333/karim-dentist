import { CalendarDays, CircleCheck, MessageSquareText } from "lucide-react";

const NAV_ITEMS = ["Overview", "Reservations", "Patients", "Support", "Messaging"];

const KPIS = [
  { label: "Pending bookings", tag: "review", tagClass: "text-[#EA580C]", value: "2", Icon: MessageSquareText, wrap: "bg-[#EA580C]" },
  { label: "Today's chair time", tag: "today", tagClass: "text-neutral-400", value: "1", Icon: CalendarDays, wrap: "bg-[#3B82F6]" },
  { label: "Confirmed this week", tag: "", tagClass: "", value: "1", Icon: CircleCheck, wrap: "bg-[#16A34A]" },
];

const SCHEDULE = [
  { time: "11:00 AM", title: "General consultation", patient: "Nour El-Sayed" },
  { time: "02:00 PM", title: "General consultation", patient: "Youssef Adel" },
];

/**
 * Purely illustrative — plain HTML/CSS, no real data or generated image.
 * Modeled directly on the real /admin overview screen (greeting header,
 * DashboardKpiCard-style tiles, Day Schedule strip) so this reads as this
 * product's actual design, not a generic mockup.
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
          <div className="w-28 shrink-0 border-e border-black/5 bg-[#f7f8f8] p-3">
            <div className="mb-3 h-3 w-14 rounded-full bg-[#5e6ad2]/70" />
            {NAV_ITEMS.map((item, index) => (
              <div
                key={item}
                className={`mb-1.5 truncate rounded-md px-2 py-1.5 text-[9px] font-medium ${
                  index === 0 ? "bg-[#5e6ad2]/10 text-[#5e6ad2]" : "text-neutral-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#5e6ad2] text-[10px] font-semibold text-white">
                K
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold text-neutral-800">
                  Good afternoon, Karim
                </p>
                <p className="truncate text-[8px] text-neutral-500">
                  Next: Youssef Adel · today at 2:00 PM
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {KPIS.map(({ label, tag, tagClass, value, Icon, wrap }) => (
                <article
                  key={label}
                  className="rounded-lg border border-black/5 bg-white p-2 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="truncate text-[8px] text-neutral-500">{label}</p>
                    {tag ? (
                      <span className={`shrink-0 text-[7px] font-medium ${tagClass}`}>
                        {tag}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex items-end justify-between">
                    <p className="text-base font-semibold leading-none text-neutral-800">
                      {value}
                    </p>
                    <span
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-md text-white ${wrap}`}
                    >
                      <Icon className="size-2.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-3 rounded-lg border border-black/5 p-2.5">
              <p className="mb-2 text-[9px] font-semibold text-neutral-700">
                Day Schedule
              </p>
              <div className="space-y-1.5">
                {SCHEDULE.map((row) => (
                  <div
                    key={row.time}
                    className="flex items-center gap-2 rounded-md bg-[#5e6ad2]/8 px-2 py-1.5"
                  >
                    <span className="w-12 shrink-0 text-[8px] text-neutral-500">
                      {row.time}
                    </span>
                    <div className="min-w-0 flex-1 border-s-2 border-[#5e6ad2] ps-2">
                      <p className="truncate text-[9px] font-medium text-neutral-800">
                        {row.title}
                      </p>
                      <p className="truncate text-[8px] text-neutral-500">
                        {row.patient}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
