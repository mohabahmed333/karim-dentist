import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { InventoryAnalyticsDashboard } from "@/features/admin/components/inventoryAnalytics/InventoryAnalyticsDashboard";
import { INVENTORY_ANALYTICS_CATALOG } from "@/features/admin/lib/inventoryAnalyticsCatalog";
import { normalizeDashboardLayout } from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
import {
  inventoryAnalyticsFiltersCache,
  resolveInventoryAnalyticsRange,
} from "@/features/admin/lib/inventoryAnalyticsFilters";
import { buildConsumptionTrendChart } from "@/features/admin/lib/inventoryAnalyticsStats";
import { getDashboardLayout } from "@/services/dashboard_layouts/queries";
import {
  listExpiringSoonBatches,
  listReorderSuggestions,
  listSupplierSpend,
  listTopConsumedItems,
  listWastageByReason,
  listWeekConsumptionRows,
} from "@/services/inventory/statsQueries";
import type {
  ExpiringBatch,
  ReorderSuggestion,
  SupplierSpend,
  TopConsumedItem,
  WastageByReason,
  WeekConsumptionRow,
} from "@/services/inventory/statsQueries";

export const dynamic = "force-dynamic";

const PAGE_KEY = "inventoryAnalytics";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InventoryAnalyticsPage({ searchParams }: PageProps) {
  await requirePagePermission("inventory.view");
  const { range } = await inventoryAnalyticsFiltersCache.parse(searchParams);
  const now = new Date();
  const { from, to } = resolveInventoryAnalyticsRange(range, now);

  const supabase = await createClient();
  const [
    savedLayout,
    consumptionRows,
    topConsumedItems,
    wastageByReason,
    supplierSpend,
    expiringSoon,
    reorderSuggestions,
  ] = await Promise.all([
    getDashboardLayout(supabase, PAGE_KEY).catch(() => null),
    listWeekConsumptionRows(supabase, from, to).catch(() => [] as WeekConsumptionRow[]),
    listTopConsumedItems(supabase, from, to).catch(() => [] as TopConsumedItem[]),
    listWastageByReason(supabase, from, to).catch(() => [] as WastageByReason[]),
    listSupplierSpend(supabase, from, to).catch(() => [] as SupplierSpend[]),
    listExpiringSoonBatches(supabase, now).catch(() => [] as ExpiringBatch[]),
    listReorderSuggestions(supabase).catch(() => [] as ReorderSuggestion[]),
  ]);

  const initialLayout = normalizeDashboardLayout(savedLayout, INVENTORY_ANALYTICS_CATALOG);

  return (
    <InventoryAnalyticsDashboard
      initialLayout={initialLayout}
      consumptionTrend={buildConsumptionTrendChart(consumptionRows, new Date(from), new Date(to))}
      topConsumedItems={topConsumedItems}
      wastageByReason={wastageByReason}
      supplierSpend={supplierSpend}
      expiringSoon={expiringSoon}
      reorderSuggestions={reorderSuggestions}
    />
  );
}
