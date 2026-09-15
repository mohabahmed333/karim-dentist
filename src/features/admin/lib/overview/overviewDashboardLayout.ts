import * as generic from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
import { ensureDashboardRowIds } from "@/features/admin/lib/dashboardWidgets/dashboardStacks";
import { parseDashboardWidgetHeight } from "@/features/admin/lib/dashboardWidgets/dashboardWidgetHeight";
import type {
  DashboardColSpan,
  DashboardLayout,
  DashboardWidgetPlacement,
} from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import { DASHBOARD_COL_SPANS } from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
import {
  DEFAULT_OVERVIEW_LAYOUT,
  LEGACY_OVERVIEW_WIDGET_EXPAND,
  OVERVIEW_CATALOG,
  OVERVIEW_WIDGET_CATALOG,
  OVERVIEW_WIDGET_IDS,
  overviewWidgetMeta,
  type OverviewWidgetId,
} from "./overviewDashboardCatalog";

export {
  DASHBOARD_COL_SPANS,
  DEFAULT_OVERVIEW_LAYOUT,
  DEFAULT_OVERVIEW_LAYOUT as DEFAULT_DASHBOARD_LAYOUT,
  OVERVIEW_CATALOG,
  OVERVIEW_WIDGET_CATALOG,
  OVERVIEW_WIDGET_CATALOG as DASHBOARD_WIDGET_CATALOG,
  OVERVIEW_WIDGET_IDS,
  OVERVIEW_WIDGET_IDS as DASHBOARD_WIDGET_IDS,
  overviewWidgetMeta,
  overviewWidgetMeta as widgetMeta,
  type OverviewWidgetId,
  type OverviewWidgetId as DashboardWidgetId,
};
export type { DashboardColSpan, DashboardLayout, DashboardWidgetPlacement, DashboardWidgetMeta } from "@/features/admin/lib/dashboardWidgets/dashboardCatalog";
export { colSpanClass, colSpanLabelKey, resolveBesideSpans } from "@/features/admin/lib/dashboardWidgets/dashboardLayout";
export type { DashboardDropEdge } from "@/features/admin/lib/dashboardWidgets/dashboardDrop";
export { compatibleRowSpans, dropEdgeFromRatios, exactRowPartners, resolveRowPairSpans } from "@/features/admin/lib/dashboardWidgets/dashboardDrop";
export {
  appendToDashboardStack,
  ensureDashboardRowIds,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  moveToNewDashboardStack,
  packDashboardStackRows,
  placeDashboardWidget,
  placeDashboardWidgetBeside,
  placeInDashboardRowGap,
  resizeDashboardStack,
  rowGapColSpan,
  type DashboardStack,
  type DashboardStackRow,
} from "@/features/admin/lib/dashboardWidgets/dashboardStacks";

const ID_SET = new Set<string>(OVERVIEW_WIDGET_IDS);
const SPAN_SET = new Set<number>(DASHBOARD_COL_SPANS);

function isWidgetId(value: unknown): value is OverviewWidgetId {
  return typeof value === "string" && ID_SET.has(value);
}

function clampColSpan(id: OverviewWidgetId, raw: unknown): DashboardColSpan {
  const meta = overviewWidgetMeta(id);
  const n = typeof raw === "number" ? raw : meta.defaultColSpan;
  if (meta.allowedColSpans.includes(n as DashboardColSpan)) {
    return n as DashboardColSpan;
  }
  if (SPAN_SET.has(n)) {
    const closest = [...meta.allowedColSpans].sort(
      (a, b) => Math.abs(a - n) - Math.abs(b - n),
    )[0]!;
    return closest;
  }
  return meta.defaultColSpan;
}

function expandLegacyId(id: string): OverviewWidgetId[] {
  const expanded = LEGACY_OVERVIEW_WIDGET_EXPAND[id];
  if (expanded) return [...expanded];
  return isWidgetId(id) ? [id] : [];
}

export function cloneDashboardLayout(layout: DashboardLayout): DashboardLayout {
  return generic.cloneDashboardLayout(layout);
}

/**
 * Overview's own normalize keeps the legacy-bundle-expansion and colStart
 * migration the generic engine deliberately drops (those were one-time data
 * migrations for rows saved before the current layout format existed — not
 * something a brand-new page's storage needs to carry). Unchanged algorithm
 * from before this refactor, just resolved against OVERVIEW_WIDGET_CATALOG.
 */
export function normalizeDashboardLayout(raw: unknown): DashboardLayout {
  if (!Array.isArray(raw) || raw.length === 0) {
    return cloneDashboardLayout(DEFAULT_OVERVIEW_LAYOUT);
  }
  const seen = new Set<OverviewWidgetId>();
  const out: DashboardLayout = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string") continue;
    const colRaw = (row as { colSpan?: unknown }).colSpan;
    const legacyBundle = Object.prototype.hasOwnProperty.call(
      LEGACY_OVERVIEW_WIDGET_EXPAND,
      id,
    );
    for (const nextId of expandLegacyId(id)) {
      if (seen.has(nextId)) continue;
      seen.add(nextId);
      const colSpan = clampColSpan(
        nextId,
        legacyBundle ? overviewWidgetMeta(nextId).defaultColSpan : colRaw,
      );
      const rawStackId = (row as { stackId?: unknown }).stackId;
      const rawRowId = (row as { rowId?: unknown }).rowId;
      const heightPx = parseDashboardWidgetHeight(
        (row as { heightPx?: unknown }).heightPx,
      );
      const placement: DashboardWidgetPlacement = {
        id: nextId,
        colSpan,
        ...(typeof rawStackId === "string" && rawStackId ? { stackId: rawStackId } : {}),
        ...(typeof rawRowId === "string" && rawRowId ? { rowId: rawRowId } : {}),
        ...(heightPx != null ? { heightPx } : {}),
      };

      // Migrate the short-lived colStart format into a two-item stack.
      const oldColStart = (row as { colStart?: unknown }).colStart;
      if (
        placement.stackId == null &&
        typeof oldColStart === "number" &&
        Number.isFinite(oldColStart)
      ) {
        const anchor = [...out].reverse().find((item) => item.colSpan === colSpan);
        if (anchor) {
          const stackId = anchor.stackId ?? `stack:${anchor.id}`;
          anchor.stackId = stackId;
          placement.stackId = stackId;
        }
      }
      out.push(placement);
    }
  }
  return ensureDashboardRowIds(
    out.length > 0 ? out : cloneDashboardLayout(DEFAULT_OVERVIEW_LAYOUT),
  );
}

export function moveDashboardWidget(
  layout: DashboardLayout,
  fromIndex: number,
  toIndex: number,
): DashboardLayout {
  return generic.moveDashboardWidget(layout, fromIndex, toIndex);
}

export function addDashboardWidget(
  layout: DashboardLayout,
  id: OverviewWidgetId,
): DashboardLayout {
  return generic.addDashboardWidget(layout, id, OVERVIEW_CATALOG);
}

export function removeDashboardWidget(
  layout: DashboardLayout,
  id: OverviewWidgetId,
): DashboardLayout {
  return generic.removeDashboardWidget(layout, id);
}

export function resizeDashboardWidget(
  layout: DashboardLayout,
  id: OverviewWidgetId,
  colSpan: DashboardColSpan,
): DashboardLayout {
  return generic.resizeDashboardWidget(layout, id, colSpan, OVERVIEW_CATALOG);
}

export function resizeDashboardWidgetHeight(
  layout: DashboardLayout,
  id: OverviewWidgetId,
  heightPx: number,
): DashboardLayout {
  return generic.resizeDashboardWidgetHeight(layout, id, heightPx);
}

export function missingDashboardWidgets(
  layout: DashboardLayout,
  hiddenWidgetIds: readonly OverviewWidgetId[] = [],
): OverviewWidgetId[] {
  return generic.missingDashboardWidgets(
    layout,
    OVERVIEW_CATALOG,
    hiddenWidgetIds,
  ) as OverviewWidgetId[];
}
