import type {
  DashboardCatalog,
  DashboardLayout,
  DashboardWidgetMeta,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import { DASHBOARD_COL_SPANS } from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";

export const INVENTORY_ANALYTICS_WIDGET_IDS = [
  "consumptionTrend",
  "topConsumedItems",
  "wastageByReason",
  "supplierSpend",
  "expiringSoon",
  "reorderSuggestions",
] as const;

export type InventoryAnalyticsWidgetId =
  (typeof INVENTORY_ANALYTICS_WIDGET_IDS)[number];

const ALL_SPANS = DASHBOARD_COL_SPANS;

export const INVENTORY_ANALYTICS_WIDGET_CATALOG: readonly DashboardWidgetMeta[] = [
  {
    id: "consumptionTrend",
    labelKey: "admin.inventoryAnalytics.widget.consumptionTrend",
    defaultColSpan: 12,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "topConsumedItems",
    labelKey: "admin.inventoryAnalytics.widget.topConsumedItems",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "supplierSpend",
    labelKey: "admin.inventoryAnalytics.widget.supplierSpend",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "wastageByReason",
    labelKey: "admin.inventoryAnalytics.widget.wastageByReason",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "expiringSoon",
    labelKey: "admin.inventoryAnalytics.widget.expiringSoon",
    defaultColSpan: 6,
    allowedColSpans: ALL_SPANS,
  },
  {
    id: "reorderSuggestions",
    labelKey: "admin.inventoryAnalytics.widget.reorderSuggestions",
    defaultColSpan: 12,
    allowedColSpans: ALL_SPANS,
  },
];

export function inventoryAnalyticsWidgetMeta(id: string): DashboardWidgetMeta {
  return INVENTORY_ANALYTICS_WIDGET_CATALOG.find((w) => w.id === id)!;
}

/** All 6 widgets ship by default — this page exists to show them, unlike Overview's opt-in extras. */
export const DEFAULT_INVENTORY_ANALYTICS_LAYOUT: DashboardLayout = [
  { id: "consumptionTrend", colSpan: 12 },
  { id: "topConsumedItems", colSpan: 6 },
  { id: "supplierSpend", colSpan: 6 },
  { id: "wastageByReason", colSpan: 6 },
  { id: "expiringSoon", colSpan: 6 },
  { id: "reorderSuggestions", colSpan: 12 },
];

export const INVENTORY_ANALYTICS_CATALOG: DashboardCatalog = {
  ids: INVENTORY_ANALYTICS_WIDGET_IDS,
  meta: inventoryAnalyticsWidgetMeta,
  defaultLayout: DEFAULT_INVENTORY_ANALYTICS_LAYOUT,
};
