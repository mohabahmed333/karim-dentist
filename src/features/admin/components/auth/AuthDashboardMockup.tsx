const NAV_ITEMS = ["Overview", "Reservations", "Patients", "Support", "Messaging"];

const STAT_ROWS = [
  { label: "Today's reservations", value: "18" },
  { label: "Open conversations", value: "6" },
  { label: "Avg. reply time", value: "3m" },
];

/**
 * Purely illustrative — plain HTML/CSS, no real data or generated image.
 * Built from the actual admin nav labels so it reads as this product, not a
 * generic stock dashboard.
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
            <div className="mb-3 h-3 w-16 rounded-full bg-[var(--admin-primary,#5e6ad2)]/70" />
            {NAV_ITEMS.map((item, index) => (
              <div
                key={item}
                className={`mb-1.5 truncate rounded-md px-2 py-1.5 text-[10px] font-medium ${
                  index === 0
                    ? "bg-[var(--admin-primary,#5e6ad2)]/10 text-[var(--admin-primary,#5e6ad2)]"
                    : "text-neutral-500"
                }`}
              >
                {item}
              </div>
            ))}
          </div>
          <div className="flex-1 p-4">
            <div className="mb-3 h-2.5 w-24 rounded-full bg-neutral-200" />
            <div className="grid grid-cols-3 gap-2">
              {STAT_ROWS.map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-black/5 bg-[#f7f8f8] p-2.5"
                >
                  <div className="text-base font-semibold text-neutral-800">
                    {row.value}
                  </div>
                  <div className="mt-1 text-[9px] leading-tight text-neutral-500">
                    {row.label}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1.5">
              {[0, 1, 2].map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-2 rounded-lg border border-black/5 p-2"
                >
                  <div className="size-5 shrink-0 rounded-full bg-neutral-200" />
                  <div className="h-2 flex-1 rounded-full bg-neutral-100" />
                  <div className="h-2 w-8 rounded-full bg-neutral-100" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
