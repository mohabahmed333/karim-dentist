import {
  DASHBOARD_COL_SPANS,
  type DashboardCatalog,
  type DashboardColSpan,
  type DashboardLayout,
  type DashboardWidgetPlacement,
} from "./dashboardCatalog";
import { resolveRowPairSpans } from "./dashboardDrop";
import {
  ensureDashboardRowIds,
  resizeDashboardStack,
} from "./dashboardStacks";
import {
  parseDashboardWidgetHeight,
  clampDashboardWidgetHeight,
} from "./dashboardWidgetHeight";

export type { DashboardCatalog, DashboardColSpan, DashboardLayout, DashboardWidgetPlacement } from "./dashboardCatalog";
export { DASHBOARD_COL_SPANS, colSpanClass, colSpanLabelKey } from "./dashboardCatalog";
export type { DashboardDropEdge } from "./dashboardDrop";
export {
  compatibleRowSpans,
  dropEdgeFromRatios,
  exactRowPartners,
  resolveRowPairSpans,
} from "./dashboardDrop";
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
} from "./dashboardStacks";
export {
  clampDashboardWidgetHeight,
  DASHBOARD_WIDGET_HEIGHT_DEFAULT,
  DASHBOARD_WIDGET_HEIGHT_MAX,
  DASHBOARD_WIDGET_HEIGHT_MIN,
  nextDashboardWidgetHeightFromDrag,
  parseDashboardWidgetHeight,
} from "./dashboardWidgetHeight";

export function resolveBesideSpans(
  dragged: DashboardColSpan,
  target: DashboardColSpan,
): { dragged: DashboardColSpan; target: DashboardColSpan } {
  const row = resolveRowPairSpans(dragged, target);
  return { dragged: row.left, target: row.right };
}

const SPAN_SET = new Set<number>(DASHBOARD_COL_SPANS);

function clampColSpan(
  id: string,
  raw: unknown,
  catalog: DashboardCatalog,
): DashboardColSpan {
  const meta = catalog.meta(id);
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

/** Shallow-clone each placement so callers never mutate a stored default. */
export function cloneDashboardLayout(layout: DashboardLayout): DashboardLayout {
  return layout.map((w) => ({ ...w }));
}

/** Coerce unknown JSON into a valid, catalog-recognized, ordered layout. */
export function normalizeDashboardLayout(
  raw: unknown,
  catalog: DashboardCatalog,
): DashboardLayout {
  if (!Array.isArray(raw) || raw.length === 0) {
    return cloneDashboardLayout(catalog.defaultLayout);
  }
  const idSet = new Set(catalog.ids);
  const seen = new Set<string>();
  const out: DashboardLayout = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string" || !idSet.has(id) || seen.has(id)) continue;
    seen.add(id);
    const colSpan = clampColSpan(id, (row as { colSpan?: unknown }).colSpan, catalog);
    const rawStackId = (row as { stackId?: unknown }).stackId;
    const rawRowId = (row as { rowId?: unknown }).rowId;
    const heightPx = parseDashboardWidgetHeight((row as { heightPx?: unknown }).heightPx);
    out.push({
      id,
      colSpan,
      ...(typeof rawStackId === "string" && rawStackId ? { stackId: rawStackId } : {}),
      ...(typeof rawRowId === "string" && rawRowId ? { rowId: rawRowId } : {}),
      ...(heightPx != null ? { heightPx } : {}),
    });
  }
  return ensureDashboardRowIds(
    out.length > 0 ? out : cloneDashboardLayout(catalog.defaultLayout),
  );
}

export function moveDashboardWidget(
  layout: DashboardLayout,
  fromIndex: number,
  toIndex: number,
): DashboardLayout {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= layout.length ||
    toIndex >= layout.length ||
    fromIndex === toIndex
  ) {
    return layout;
  }
  const next = [...layout];
  const [item] = next.splice(fromIndex, 1);
  if (!item) return layout;
  next.splice(toIndex, 0, item);
  return next;
}

export function addDashboardWidget(
  layout: DashboardLayout,
  id: string,
  catalog: DashboardCatalog,
): DashboardLayout {
  if (layout.some((w) => w.id === id)) return layout;
  const meta = catalog.meta(id);
  return ensureDashboardRowIds([
    ...layout,
    { id, colSpan: meta.defaultColSpan, rowId: `row:new-${id}` },
  ]);
}

export function removeDashboardWidget(
  layout: DashboardLayout,
  id: string,
): DashboardLayout {
  return layout.filter((w) => w.id !== id);
}

export function resizeDashboardWidget(
  layout: DashboardLayout,
  id: string,
  colSpan: DashboardColSpan,
  catalog: DashboardCatalog,
): DashboardLayout {
  return resizeDashboardStack(layout, id, clampColSpan(id, colSpan, catalog));
}

export function resizeDashboardWidgetHeight(
  layout: DashboardLayout,
  id: string,
  heightPx: number,
): DashboardLayout {
  const next = clampDashboardWidgetHeight(heightPx);
  return layout.map((w) => (w.id === id ? { ...w, heightPx: next } : w));
}

export function missingDashboardWidgets(
  layout: DashboardLayout,
  catalog: DashboardCatalog,
  hiddenWidgetIds: readonly string[] = [],
): string[] {
  const present = new Set(layout.map((w) => w.id));
  const hidden = new Set(hiddenWidgetIds);
  return catalog.ids.filter((id) => !present.has(id) && !hidden.has(id));
}
