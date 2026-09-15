import type {
  DashboardCatalog,
  DashboardLayout,
  DashboardWidgetMeta,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import { DASHBOARD_COL_SPANS } from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";

export const OVERVIEW_WIDGET_IDS = [
  "attentionPending",
  "attentionToday",
  "attentionCancelled",
  "attentionNoShow",
  "kpiTodayVisits",
  "kpiPending",
  "kpiConfirmedWeek",
  "kpiServices",
  "kpiCancelled",
  "kpiNoShow",
  "kpiCompleted",
  "kpiTomorrow",
  "kpiWeekTotal",
  "kpiUnreadChats",
  "daySchedule",
  "bookings",
  "recent",
  "schedule",
  "messages",
  "listPending",
  "listToday",
  "listTopServices",
  "listNextAppointment",
  "chartVisitsWeek",
  "chartBookingMix",
  "chartStatus",
  "chartBusyHours",
  "chartDayTrend",
  "chartWeekCompare",
  "chartCancelRate",
  "chartServiceRank",
  "myProductionWeek",
  "chartBillingRevenue",
  "chartBillingMethodMix",
  "kpiOutstandingBalance",
  "kpiPendingPayments",
  "chartInventoryStockValue",
  "chartInventoryConsumption",
  "kpiLowStock",
  "kpiPendingApprovals",
] as const;

export type OverviewWidgetId = (typeof OVERVIEW_WIDGET_IDS)[number];

/** Old combined widgets → individual cards (normalize expands these). */
export const LEGACY_OVERVIEW_WIDGET_EXPAND: Record<
  string,
  readonly OverviewWidgetId[]
> = {
  attention: ["attentionPending", "attentionToday"],
  kpis: ["kpiTodayVisits", "kpiPending", "kpiConfirmedWeek", "kpiServices"],
  charts: [
    "chartVisitsWeek",
    "chartBookingMix",
    "chartStatus",
    "chartBusyHours",
    "chartDayTrend",
  ],
};

const ALL_SPANS = DASHBOARD_COL_SPANS;
const CARD = { defaultColSpan: 3 as const, allowedColSpans: ALL_SPANS };
const CHART = { defaultColSpan: 6 as const, allowedColSpans: ALL_SPANS };

export const OVERVIEW_WIDGET_CATALOG: readonly DashboardWidgetMeta[] = [
  { id: "attentionPending", labelKey: "admin.overview.widget.attentionPending", ...CARD },
  { id: "attentionToday", labelKey: "admin.overview.widget.attentionToday", ...CARD },
  { id: "attentionCancelled", labelKey: "admin.overview.widget.attentionCancelled", ...CARD },
  { id: "attentionNoShow", labelKey: "admin.overview.widget.attentionNoShow", ...CARD },
  { id: "kpiTodayVisits", labelKey: "admin.overview.widget.kpiTodayVisits", ...CARD },
  { id: "kpiPending", labelKey: "admin.overview.widget.kpiPending", ...CARD },
  { id: "kpiConfirmedWeek", labelKey: "admin.overview.widget.kpiConfirmedWeek", ...CARD },
  { id: "kpiServices", labelKey: "admin.overview.widget.kpiServices", ...CARD },
  { id: "kpiCancelled", labelKey: "admin.overview.widget.kpiCancelled", ...CARD },
  { id: "kpiNoShow", labelKey: "admin.overview.widget.kpiNoShow", ...CARD },
  { id: "kpiCompleted", labelKey: "admin.overview.widget.kpiCompleted", ...CARD },
  { id: "kpiTomorrow", labelKey: "admin.overview.widget.kpiTomorrow", ...CARD },
  { id: "kpiWeekTotal", labelKey: "admin.overview.widget.kpiWeekTotal", ...CARD },
  { id: "kpiUnreadChats", labelKey: "admin.overview.widget.kpiUnreadChats", ...CARD },
  { id: "daySchedule", labelKey: "admin.overview.widget.daySchedule", defaultColSpan: 12, allowedColSpans: ALL_SPANS },
  { id: "bookings", labelKey: "admin.overview.widget.bookings", ...CARD },
  { id: "recent", labelKey: "admin.overview.widget.recent", ...CARD },
  { id: "schedule", labelKey: "admin.overview.widget.schedule", ...CARD },
  { id: "messages", labelKey: "admin.overview.widget.messages", ...CARD },
  { id: "listPending", labelKey: "admin.overview.widget.listPending", ...CARD },
  { id: "listToday", labelKey: "admin.overview.widget.listToday", ...CARD },
  { id: "listTopServices", labelKey: "admin.overview.widget.listTopServices", ...CARD },
  { id: "listNextAppointment", labelKey: "admin.overview.widget.listNextAppointment", ...CARD },
  { id: "chartVisitsWeek", labelKey: "admin.overview.widget.chartVisitsWeek", ...CHART },
  { id: "chartBookingMix", labelKey: "admin.overview.widget.chartBookingMix", ...CHART },
  { id: "chartStatus", labelKey: "admin.overview.widget.chartStatus", ...CHART },
  { id: "chartBusyHours", labelKey: "admin.overview.widget.chartBusyHours", ...CHART },
  { id: "chartDayTrend", labelKey: "admin.overview.widget.chartDayTrend", defaultColSpan: 12, allowedColSpans: ALL_SPANS },
  { id: "chartWeekCompare", labelKey: "admin.overview.widget.chartWeekCompare", ...CHART },
  { id: "chartCancelRate", labelKey: "admin.overview.widget.chartCancelRate", ...CHART },
  { id: "chartServiceRank", labelKey: "admin.overview.widget.chartServiceRank", ...CHART },
  { id: "myProductionWeek", labelKey: "admin.overview.widget.myProductionWeek", ...CARD },
  { id: "chartBillingRevenue", labelKey: "admin.overview.widget.chartBillingRevenue", ...CHART },
  { id: "chartBillingMethodMix", labelKey: "admin.overview.widget.chartBillingMethodMix", ...CHART },
  { id: "kpiOutstandingBalance", labelKey: "admin.overview.widget.kpiOutstandingBalance", ...CARD },
  { id: "kpiPendingPayments", labelKey: "admin.overview.widget.kpiPendingPayments", ...CARD },
  { id: "chartInventoryStockValue", labelKey: "admin.overview.widget.chartInventoryStockValue", ...CHART },
  { id: "chartInventoryConsumption", labelKey: "admin.overview.widget.chartInventoryConsumption", ...CHART },
  { id: "kpiLowStock", labelKey: "admin.overview.widget.kpiLowStock", ...CARD },
  { id: "kpiPendingApprovals", labelKey: "admin.overview.widget.kpiPendingApprovals", ...CARD },
];

export function overviewWidgetMeta(id: string): DashboardWidgetMeta {
  return OVERVIEW_WIDGET_CATALOG.find((w) => w.id === id)!;
}

export const DEFAULT_OVERVIEW_LAYOUT: DashboardLayout = [
  { id: "attentionPending", colSpan: 3 },
  { id: "attentionToday", colSpan: 3 },
  { id: "kpiTodayVisits", colSpan: 3 },
  { id: "kpiPending", colSpan: 3 },
  { id: "kpiConfirmedWeek", colSpan: 3 },
  { id: "kpiServices", colSpan: 3 },
  { id: "daySchedule", colSpan: 12 },
  { id: "bookings", colSpan: 3 },
  { id: "recent", colSpan: 3 },
  { id: "schedule", colSpan: 3 },
  { id: "messages", colSpan: 3 },
  { id: "chartVisitsWeek", colSpan: 6 },
  { id: "chartBookingMix", colSpan: 6 },
  { id: "chartStatus", colSpan: 6 },
  { id: "chartBusyHours", colSpan: 6 },
  { id: "chartDayTrend", colSpan: 12 },
];

export const OVERVIEW_CATALOG: DashboardCatalog = {
  ids: OVERVIEW_WIDGET_IDS,
  meta: overviewWidgetMeta,
  defaultLayout: DEFAULT_OVERVIEW_LAYOUT,
};
