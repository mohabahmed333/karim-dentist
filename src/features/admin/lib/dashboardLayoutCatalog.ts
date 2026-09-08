import type { AdminMessageKey } from "@/lib/i18n/messages/admin/en";

export const DASHBOARD_WIDGET_IDS = [
  "attentionPending",
  "attentionToday",
  "kpiTodayVisits",
  "kpiPending",
  "kpiConfirmedWeek",
  "kpiServices",
  "daySchedule",
  "bookings",
  "recent",
  "schedule",
  "messages",
  "chartVisitsWeek",
  "chartBookingMix",
  "chartStatus",
  "chartBusyHours",
  "chartDayTrend",
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];

/** Old combined widgets → individual cards (normalize expands these). */
export const LEGACY_DASHBOARD_WIDGET_EXPAND: Record<
  string,
  readonly DashboardWidgetId[]
> = {
  attention: ["attentionPending", "attentionToday"],
  kpis: [
    "kpiTodayVisits",
    "kpiPending",
    "kpiConfirmedWeek",
    "kpiServices",
  ],
  charts: [
    "chartVisitsWeek",
    "chartBookingMix",
    "chartStatus",
    "chartBusyHours",
    "chartDayTrend",
  ],
};

export const DASHBOARD_COL_SPANS = [3, 4, 6, 8, 9, 12] as const;
export type DashboardColSpan = (typeof DASHBOARD_COL_SPANS)[number];

export type DashboardWidgetPlacement = {
  id: DashboardWidgetId;
  colSpan: DashboardColSpan;
  /** Widgets with the same stackId render in one vertical column. */
  stackId?: string;
  /**
   * Widgets sharing a rowId stay on the same grid row.
   * Shrinking leaves gap on that row instead of pulling the next row up.
   */
  rowId?: string;
  /** Reserved grid width while resizing — legacy; stripped on write. */
  slotSpan?: DashboardColSpan;
  /** Optional fixed viewport height (px); content scrolls inside. */
  heightPx?: number;
};

export type DashboardLayout = DashboardWidgetPlacement[];

export type DashboardWidgetMeta = {
  id: DashboardWidgetId;
  labelKey: AdminMessageKey;
  defaultColSpan: DashboardColSpan;
  allowedColSpans: readonly DashboardColSpan[];
};

const ALL_SPANS = DASHBOARD_COL_SPANS;
const CARD = {
  defaultColSpan: 3 as DashboardColSpan,
  allowedColSpans: ALL_SPANS,
};
const CHART = {
  defaultColSpan: 6 as DashboardColSpan,
  allowedColSpans: ALL_SPANS,
};

export const DASHBOARD_WIDGET_CATALOG: readonly DashboardWidgetMeta[] = [
  {
    id: "attentionPending",
    labelKey: "admin.overview.widget.attentionPending",
    ...CARD,
  },
  {
    id: "attentionToday",
    labelKey: "admin.overview.widget.attentionToday",
    ...CARD,
  },
  {
    id: "kpiTodayVisits",
    labelKey: "admin.overview.widget.kpiTodayVisits",
    ...CARD,
  },
  {
    id: "kpiPending",
    labelKey: "admin.overview.widget.kpiPending",
    ...CARD,
  },
  {
    id: "kpiConfirmedWeek",
    labelKey: "admin.overview.widget.kpiConfirmedWeek",
    ...CARD,
  },
  {
    id: "kpiServices",
    labelKey: "admin.overview.widget.kpiServices",
    ...CARD,
  },
  {
    id: "daySchedule",
    labelKey: "admin.overview.widget.daySchedule",
    defaultColSpan: 12,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "bookings",
    labelKey: "admin.overview.widget.bookings",
    ...CARD,
  },
  {
    id: "recent",
    labelKey: "admin.overview.widget.recent",
    ...CARD,
  },
  {
    id: "schedule",
    labelKey: "admin.overview.widget.schedule",
    ...CARD,
  },
  {
    id: "messages",
    labelKey: "admin.overview.widget.messages",
    ...CARD,
  },
  {
    id: "chartVisitsWeek",
    labelKey: "admin.overview.widget.chartVisitsWeek",
    ...CHART,
  },
  {
    id: "chartBookingMix",
    labelKey: "admin.overview.widget.chartBookingMix",
    ...CHART,
  },
  {
    id: "chartStatus",
    labelKey: "admin.overview.widget.chartStatus",
    ...CHART,
  },
  {
    id: "chartBusyHours",
    labelKey: "admin.overview.widget.chartBusyHours",
    ...CHART,
  },
  {
    id: "chartDayTrend",
    labelKey: "admin.overview.widget.chartDayTrend",
    defaultColSpan: 12,
    allowedColSpans: ALL_SPANS,
  },
];

export function colSpanLabelKey(
  colSpan: DashboardColSpan,
): AdminMessageKey {
  switch (colSpan) {
    case 3:
      return "admin.overview.customize.sizeQuarter";
    case 4:
      return "admin.overview.customize.sizeThird";
    case 6:
      return "admin.overview.customize.sizeHalf";
    case 8:
      return "admin.overview.customize.sizeTwoThirds";
    case 9:
      return "admin.overview.customize.sizeThreeQuarters";
    case 12:
      return "admin.overview.customize.sizeFull";
  }
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = [
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

export function widgetMeta(id: DashboardWidgetId): DashboardWidgetMeta {
  return DASHBOARD_WIDGET_CATALOG.find((w) => w.id === id)!;
}

export function colSpanClass(colSpan: DashboardColSpan): string {
  switch (colSpan) {
    case 3:
      return "col-span-12 sm:col-span-3";
    case 4:
      return "col-span-12 sm:col-span-4";
    case 6:
      return "col-span-12 sm:col-span-6";
    case 8:
      return "col-span-12 sm:col-span-8";
    case 9:
      return "col-span-12 sm:col-span-9";
    case 12:
      return "col-span-12";
  }
}
