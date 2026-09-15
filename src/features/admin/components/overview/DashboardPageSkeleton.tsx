import { AdminSkeleton as Block } from "@/features/admin/components/AdminSkeleton";
import { colSpanClass } from "@/features/admin/lib/overview/overviewDashboardLayout";

// Mirrors DEFAULT_DASHBOARD_LAYOUT (dashboardLayoutCatalog.ts) packed into rows
// of 12 columns, so this stays close to what a fresh (non-customized) dashboard
// actually renders — not the fixed layout the dashboard had before it became a
// user-configurable widget grid.
const ROWS: { colSpan: 3 | 6 | 12; height: string }[][] = [
  [
    { colSpan: 3, height: "h-28" }, // attentionPending
    { colSpan: 3, height: "h-28" }, // attentionToday
    { colSpan: 3, height: "h-28" }, // kpiTodayVisits
    { colSpan: 3, height: "h-28" }, // kpiPending
  ],
  [
    { colSpan: 3, height: "h-28" }, // kpiConfirmedWeek
    { colSpan: 3, height: "h-28" }, // kpiServices
  ],
  [{ colSpan: 12, height: "h-80" }], // daySchedule
  [
    { colSpan: 3, height: "h-40" }, // bookings
    { colSpan: 3, height: "h-40" }, // recent
    { colSpan: 3, height: "h-40" }, // schedule
    { colSpan: 3, height: "h-40" }, // messages
  ],
  [
    { colSpan: 6, height: "h-64" }, // chartVisitsWeek
    { colSpan: 6, height: "h-64" }, // chartBookingMix
  ],
  [
    { colSpan: 6, height: "h-64" }, // chartStatus
    { colSpan: 6, height: "h-64" }, // chartBusyHours
  ],
  [{ colSpan: 12, height: "h-64" }], // chartDayTrend
];

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Block className="size-12 shrink-0 rounded-full" />
          <div className="space-y-2 pt-1">
            <Block className="h-7 w-48" />
            <Block className="h-4 w-56" />
          </div>
        </div>
        <Block className="h-9 w-28 shrink-0 rounded-md" />
      </div>
      <div className="space-y-3">
        {ROWS.map((row, i) => (
          <div key={i} className="grid grid-cols-12 items-stretch gap-3">
            {row.map((widget, j) => (
              <Block
                key={j}
                className={`${colSpanClass(widget.colSpan)} ${widget.height} rounded-md`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
