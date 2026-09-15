"use client";

import type { ReactNode } from "react";
import type { ConsumptionTrendPoint } from "@/features/admin/lib/inventoryAnalyticsStats";
import type {
  ExpiringBatch,
  ReorderSuggestion,
  SupplierSpend,
  TopConsumedItem,
  WastageByReason,
} from "@/services/inventory/statsQueries";
import type { InventoryAnalyticsWidgetId } from "@/features/admin/lib/inventoryAnalyticsCatalog";
import { ChartConsumptionTrend } from "./InventoryAnalyticsTrendChart";
import { ListSupplierSpend, ListTopConsumedItems } from "./InventoryAnalyticsRankedLists";
import { ChartWastageByReason } from "./InventoryAnalyticsWastageChart";
import { ListExpiringSoon, ListReorderSuggestions } from "./InventoryAnalyticsSnapshotLists";

export type InventoryAnalyticsWidgetRenderCtx = {
  consumptionTrend: ConsumptionTrendPoint[];
  topConsumedItems: TopConsumedItem[];
  wastageByReason: WastageByReason[];
  supplierSpend: SupplierSpend[];
  expiringSoon: ExpiringBatch[];
  reorderSuggestions: ReorderSuggestion[];
};

export function renderInventoryAnalyticsWidget(
  id: string,
  ctx: InventoryAnalyticsWidgetRenderCtx,
): ReactNode {
  switch (id as InventoryAnalyticsWidgetId) {
    case "consumptionTrend":
      return <ChartConsumptionTrend trend={ctx.consumptionTrend} />;
    case "topConsumedItems":
      return <ListTopConsumedItems items={ctx.topConsumedItems} />;
    case "wastageByReason":
      return <ChartWastageByReason wastage={ctx.wastageByReason} />;
    case "supplierSpend":
      return <ListSupplierSpend suppliers={ctx.supplierSpend} />;
    case "expiringSoon":
      return <ListExpiringSoon batches={ctx.expiringSoon} />;
    case "reorderSuggestions":
      return <ListReorderSuggestions suggestions={ctx.reorderSuggestions} />;
    default:
      return null;
  }
}
