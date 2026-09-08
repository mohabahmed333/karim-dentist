import {
  DASHBOARD_COL_SPANS,
  DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_LAYOUT,
  LEGACY_DASHBOARD_WIDGET_EXPAND,
  type DashboardColSpan,
  type DashboardLayout,
  type DashboardWidgetId,
  type DashboardWidgetPlacement,
  widgetMeta,
} from "./dashboardLayoutCatalog";

export {
  DASHBOARD_COL_SPANS,
  DASHBOARD_WIDGET_CATALOG,
  DASHBOARD_WIDGET_IDS,
  DEFAULT_DASHBOARD_LAYOUT,
  LEGACY_DASHBOARD_WIDGET_EXPAND,
  colSpanClass,
  colSpanLabelKey,
  widgetMeta,
  type DashboardColSpan,
  type DashboardLayout,
  type DashboardWidgetId,
  type DashboardWidgetMeta,
  type DashboardWidgetPlacement,
} from "./dashboardLayoutCatalog";

export {
  compatibleRowSpans,
  dropEdgeFromRatios,
  exactRowPartners,
  resolveRowPairSpans,
  type DashboardDropEdge,
} from "./dashboardDrop";

import { resolveRowPairSpans } from "./dashboardDrop";
import {
  ensureDashboardRowIds,
  resizeDashboardStack,
} from "./dashboardStacks";
import { parseDashboardWidgetHeight, clampDashboardWidgetHeight } from "./dashboardWidgetHeight";

export {
  DASHBOARD_WIDGET_HEIGHT_DEFAULT,
  DASHBOARD_WIDGET_HEIGHT_MAX,
  DASHBOARD_WIDGET_HEIGHT_MIN,
  clampDashboardWidgetHeight,
  nextDashboardWidgetHeightFromDrag,
  parseDashboardWidgetHeight,
} from "./dashboardWidgetHeight";

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

export function resolveBesideSpans(
  dragged: DashboardColSpan,
  target: DashboardColSpan,
): { dragged: DashboardColSpan; target: DashboardColSpan } {
  const row = resolveRowPairSpans(dragged, target);
  return { dragged: row.left, target: row.right };
}

const ID_SET = new Set<string>(DASHBOARD_WIDGET_IDS);
const SPAN_SET = new Set<number>(DASHBOARD_COL_SPANS);

function isWidgetId(value: unknown): value is DashboardWidgetId {
  return typeof value === "string" && ID_SET.has(value);
}

function clampColSpan(
  id: DashboardWidgetId,
  raw: unknown,
): DashboardColSpan {
  const meta = widgetMeta(id);
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

function expandLegacyId(id: string): DashboardWidgetId[] {
  const expanded = LEGACY_DASHBOARD_WIDGET_EXPAND[id];
  if (expanded) return [...expanded];
  return isWidgetId(id) ? [id] : [];
}

/** Shallow-clone each placement so callers never mutate the catalog default. */
export function cloneDashboardLayout(
  layout: DashboardLayout,
): DashboardLayout {
  return layout.map((w) => ({ ...w }));
}

/** Coerce unknown JSON into a valid unique ordered layout. */
export function normalizeDashboardLayout(raw: unknown): DashboardLayout {
  if (!Array.isArray(raw) || raw.length === 0) {
    return cloneDashboardLayout(DEFAULT_DASHBOARD_LAYOUT);
  }
  const seen = new Set<DashboardWidgetId>();
  const out: DashboardLayout = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const id = (row as { id?: unknown }).id;
    if (typeof id !== "string") continue;
    const colRaw = (row as { colSpan?: unknown }).colSpan;
    const legacyBundle = Object.prototype.hasOwnProperty.call(
      LEGACY_DASHBOARD_WIDGET_EXPAND,
      id,
    );
    for (const nextId of expandLegacyId(id)) {
      if (seen.has(nextId)) continue;
      seen.add(nextId);
      const colSpan = clampColSpan(
        nextId,
        legacyBundle ? widgetMeta(nextId).defaultColSpan : colRaw,
      );
      const rawStackId = (row as { stackId?: unknown }).stackId;
      const rawRowId = (row as { rowId?: unknown }).rowId;
      const heightPx = parseDashboardWidgetHeight(
        (row as { heightPx?: unknown }).heightPx,
      );
      const placement: DashboardWidgetPlacement = {
        id: nextId,
        colSpan,
        ...(typeof rawStackId === "string" && rawStackId
          ? { stackId: rawStackId }
          : {}),
        ...(typeof rawRowId === "string" && rawRowId
          ? { rowId: rawRowId }
          : {}),
        ...(heightPx != null ? { heightPx } : {}),
      };

      // Migrate the short-lived colStart format into a two-item stack.
      const oldColStart = (row as { colStart?: unknown }).colStart;
      if (
        placement.stackId == null &&
        typeof oldColStart === "number" &&
        Number.isFinite(oldColStart)
      ) {
        const anchor = [...out]
          .reverse()
          .find((item) => item.colSpan === colSpan);
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
    out.length > 0 ? out : cloneDashboardLayout(DEFAULT_DASHBOARD_LAYOUT),
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
  id: DashboardWidgetId,
): DashboardLayout {
  if (layout.some((w) => w.id === id)) return layout;
  const meta = widgetMeta(id);
  return ensureDashboardRowIds([
    ...layout,
    { id, colSpan: meta.defaultColSpan, rowId: `row:new-${id}` },
  ]);
}

export function removeDashboardWidget(
  layout: DashboardLayout,
  id: DashboardWidgetId,
): DashboardLayout {
  return layout.filter((w) => w.id !== id);
}

export function resizeDashboardWidget(
  layout: DashboardLayout,
  id: DashboardWidgetId,
  colSpan: DashboardColSpan,
): DashboardLayout {
  return resizeDashboardStack(layout, id, clampColSpan(id, colSpan));
}

export function resizeDashboardWidgetHeight(
  layout: DashboardLayout,
  id: DashboardWidgetId,
  heightPx: number,
): DashboardLayout {
  const next = clampDashboardWidgetHeight(heightPx);
  return layout.map((w) => (w.id === id ? { ...w, heightPx: next } : w));
}

export function missingDashboardWidgets(
  layout: DashboardLayout,
): DashboardWidgetId[] {
  const present = new Set(layout.map((w) => w.id));
  return DASHBOARD_WIDGET_IDS.filter((id) => !present.has(id));
}
