import type {
  DashboardColSpan,
  DashboardLayout,
  DashboardWidgetId,
  DashboardWidgetPlacement,
} from "./dashboardLayoutCatalog";
import { DASHBOARD_COL_SPANS } from "./dashboardLayoutCatalog";
import {
  resolveRowPairSpans,
  type DashboardDropEdge,
} from "./dashboardDrop";

export type DashboardStack = {
  id: string;
  colSpan: DashboardColSpan;
  rowId: string;
  widgets: DashboardWidgetPlacement[];
};

export type DashboardStackRow = {
  stacks: DashboardStack[];
  gap: number;
  afterStackId: string | null;
  rowId: string;
};

function stackKey(widget: DashboardWidgetPlacement): string {
  return widget.stackId ?? `widget:${widget.id}`;
}

function newRowId(seed: string): string {
  return `row:${seed}`;
}

function stackRowId(widgets: DashboardWidgetPlacement[], stackId: string): string {
  const existing = widgets.find((w) => w.rowId)?.rowId;
  return existing || newRowId(stackId);
}

function omitLegacy(item: DashboardWidgetPlacement): DashboardWidgetPlacement {
  const next = { ...item };
  delete next.slotSpan;
  return next;
}

/** Greedy 12-col pack used only to seed missing rowIds. */
function packGreedyRows(stacks: DashboardStack[]): DashboardStackRow[] {
  const rows: DashboardStackRow[] = [];
  let current: DashboardStack[] = [];
  let used = 0;
  for (const stack of stacks) {
    if (used > 0 && used + stack.colSpan > 12) {
      rows.push({
        stacks: current,
        gap: 12 - used,
        afterStackId: current[current.length - 1]?.id ?? null,
        rowId: current[0]?.rowId ?? newRowId(`greedy-${rows.length}`),
      });
      current = [];
      used = 0;
    }
    current.push(stack);
    used += stack.colSpan;
  }
  if (current.length) {
    rows.push({
      stacks: current,
      gap: 12 - used,
      afterStackId: current[current.length - 1]?.id ?? null,
      rowId: current[0]?.rowId ?? newRowId(`greedy-${rows.length}`),
    });
  }
  return rows;
}

/**
 * Ensure every placement has a rowId. Existing ids are kept so shrink/gap
 * stays stable; missing ids are seeded from a one-time greedy pack.
 */
export function ensureDashboardRowIds(
  layout: DashboardLayout,
): DashboardLayout {
  if (layout.length === 0) return layout;
  if (layout.every((w) => typeof w.rowId === "string" && w.rowId.length > 0)) {
    return layout.map(omitLegacy);
  }

  const stacks = groupDashboardStacksRaw(layout);
  const seeded = packGreedyRows(stacks);
  const rowByWidgetId = new Map<DashboardWidgetId, string>();
  seeded.forEach((row, index) => {
    const rowId = `row-${index}`;
    for (const stack of row.stacks) {
      for (const widget of stack.widgets) {
        rowByWidgetId.set(widget.id, widget.rowId || rowId);
      }
    }
  });

  return layout.map((widget) => {
    const next = omitLegacy(widget);
    return {
      ...next,
      rowId:
        (typeof widget.rowId === "string" && widget.rowId) ||
        rowByWidgetId.get(widget.id) ||
        newRowId(widget.id),
    };
  });
}

function groupDashboardStacksRaw(
  layout: DashboardLayout,
): DashboardStack[] {
  const stacks = new Map<string, DashboardStack>();
  for (const widget of layout) {
    const id = stackKey(widget);
    const current = stacks.get(id);
    if (current) {
      current.widgets.push(widget);
      if (widget.colSpan > current.colSpan) current.colSpan = widget.colSpan;
      if (!current.rowId && widget.rowId) current.rowId = widget.rowId;
      continue;
    }
    stacks.set(id, {
      id,
      colSpan: widget.colSpan,
      rowId: stackRowId([widget], id),
      widgets: [widget],
    });
  }
  return [...stacks.values()];
}

export function groupDashboardStacks(
  layout: DashboardLayout,
): DashboardStack[] {
  return groupDashboardStacksRaw(ensureDashboardRowIds(layout));
}

function stackMembers(
  layout: DashboardLayout,
  widget: DashboardWidgetPlacement,
): DashboardWidgetId[] {
  const key = stackKey(widget);
  return layout.filter((item) => stackKey(item) === key).map((item) => item.id);
}

function setStackWidth(
  layout: DashboardLayout,
  ids: DashboardWidgetId[],
  colSpan: DashboardColSpan,
): DashboardLayout {
  const idSet = new Set(ids);
  return layout.map((item) =>
    idSet.has(item.id) ? { ...omitLegacy(item), colSpan } : omitLegacy(item),
  );
}

function insertInStack(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
  edge: "above" | "below",
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const dragged = base[fromIndex]!;
  const target = base[targetIndex]!;
  const targetStackId = target.stackId ?? `stack:${target.id}`;
  const rowId = target.rowId ?? newRowId(targetStackId);
  const without = base.filter((_, index) => index !== fromIndex);
  const targetAt = without.findIndex((item) => item.id === target.id);
  if (targetAt < 0) return layout;
  const insertAt = edge === "above" ? targetAt : targetAt + 1;
  const next = without.map((item) =>
    item.id === target.id ||
    (target.stackId != null && item.stackId === target.stackId)
      ? {
          ...omitLegacy(item),
          stackId: targetStackId,
          colSpan: target.colSpan,
          rowId,
        }
      : omitLegacy(item),
  );
  next.splice(insertAt, 0, {
    id: dragged.id,
    stackId: targetStackId,
    colSpan: target.colSpan,
    rowId,
    ...(dragged.heightPx != null ? { heightPx: dragged.heightPx } : {}),
  });
  return next;
}

function insertBesideStack(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
  edge: "left" | "right",
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const dragged = base[fromIndex]!;
  const target = base[targetIndex]!;
  if (stackKey(dragged) === stackKey(target)) return layout;

  const draggedIds = stackMembers(base, dragged);
  const targetIds = stackMembers(base, target);
  const draggedSet = new Set(draggedIds);
  const targetSet = new Set(targetIds);
  const rowId = target.rowId ?? newRowId(target.id);
  const sameRow =
    typeof dragged.rowId === "string" &&
    dragged.rowId.length > 0 &&
    dragged.rowId === target.rowId;

  const draggedBlock = base
    .filter((item) => draggedSet.has(item.id))
    .map((item) => omitLegacy(item));
  const without = base
    .filter((item) => !draggedSet.has(item.id))
    .map(omitLegacy);

  const targetPositions = targetIds
    .map((id) => without.findIndex((item) => item.id === id))
    .filter((index) => index >= 0);
  if (!targetPositions.length) return layout;

  const pair =
    edge === "left"
      ? resolveRowPairSpans(dragged.colSpan, target.colSpan)
      : resolveRowPairSpans(target.colSpan, dragged.colSpan);
  const targetWidth = sameRow
    ? target.colSpan
    : edge === "left"
      ? pair.right
      : pair.left;
  const draggedWidth = sameRow
    ? dragged.colSpan
    : edge === "left"
      ? pair.left
      : pair.right;

  const resized = setStackWidth(without, targetIds, targetWidth).map((item) =>
    targetSet.has(item.id) ? { ...item, rowId } : item,
  );
  const insertAt =
    edge === "left"
      ? Math.min(...targetPositions)
      : Math.max(...targetPositions) + 1;
  const moving = draggedBlock.map((item) => ({
    ...item,
    colSpan: draggedWidth,
    rowId,
  }));
  resized.splice(insertAt, 0, ...moving);
  return resized;
}

export function placeDashboardWidget(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
  edge: DashboardDropEdge,
): DashboardLayout {
  if (
    fromIndex < 0 ||
    targetIndex < 0 ||
    fromIndex >= layout.length ||
    targetIndex >= layout.length ||
    fromIndex === targetIndex
  ) {
    return layout;
  }
  return edge === "above" || edge === "below"
    ? insertInStack(layout, fromIndex, targetIndex, edge)
    : insertBesideStack(layout, fromIndex, targetIndex, edge);
}

export function placeDashboardWidgetBeside(
  layout: DashboardLayout,
  fromIndex: number,
  targetIndex: number,
): DashboardLayout {
  return placeDashboardWidget(layout, fromIndex, targetIndex, "left");
}

/** Drop into a stack's empty footer — append under the last widget. */
export function appendToDashboardStack(
  layout: DashboardLayout,
  fromId: DashboardWidgetId,
  stackId: string,
): DashboardLayout {
  const stack = groupDashboardStacks(layout).find((s) => s.id === stackId);
  const last = stack?.widgets[stack.widgets.length - 1];
  if (!last || last.id === fromId) return layout;
  const from = layout.findIndex((w) => w.id === fromId);
  const to = layout.findIndex((w) => w.id === last.id);
  if (from < 0 || to < 0) return layout;
  return placeDashboardWidget(layout, from, to, "below");
}

/** Drop into blank grid space — start a new solo stack on its own row. */
export function moveToNewDashboardStack(
  layout: DashboardLayout,
  fromId: DashboardWidgetId,
  colSpan: DashboardColSpan = 12,
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const from = base.findIndex((w) => w.id === fromId);
  if (from < 0) return layout;
  const dragged = base[from]!;
  const without = base.filter((_, i) => i !== from).map(omitLegacy);
  return [
    ...without,
    {
      id: dragged.id,
      colSpan,
      rowId: newRowId(`end-${dragged.id}`),
      ...(dragged.heightPx != null ? { heightPx: dragged.heightPx } : {}),
    },
  ];
}

/**
 * Pack stacks into rows by stable rowId.
 * Shrinking a widget leaves gap on its row — later rows never auto-fill it.
 */
export function packDashboardStackRows(
  stacks: DashboardStack[],
): DashboardStackRow[] {
  const rowOrder: string[] = [];
  const byRow = new Map<string, DashboardStack[]>();
  for (const stack of stacks) {
    const rowId = stack.rowId || newRowId(stack.id);
    if (!byRow.has(rowId)) {
      byRow.set(rowId, []);
      rowOrder.push(rowId);
    }
    byRow.get(rowId)!.push(stack);
  }

  return rowOrder.map((rowId) => {
    const rowStacks = byRow.get(rowId) ?? [];
    const used = rowStacks.reduce((sum, stack) => sum + stack.colSpan, 0);
    return {
      stacks: rowStacks,
      gap: Math.max(0, 12 - used),
      afterStackId: rowStacks[rowStacks.length - 1]?.id ?? null,
      rowId,
    };
  });
}

/** Largest allowed col span that fits in leftover row space (never 12). */
export function rowGapColSpan(gap: number): DashboardColSpan | null {
  if (gap < 3) return null;
  if (gap >= 9) return 9;
  if (gap >= 8) return 8;
  if (gap >= 6) return 6;
  if (gap >= 4) return 4;
  return 3;
}

/** Drop into leftover columns after a stack on the same row. */
export function placeInDashboardRowGap(
  layout: DashboardLayout,
  fromId: DashboardWidgetId,
  afterStackId: string,
  colSpan: DashboardColSpan,
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const stacks = groupDashboardStacks(base);
  const after = stacks.find((s) => s.id === afterStackId);
  const last = after?.widgets[after.widgets.length - 1];
  if (!last) return layout;
  const rowId = after.rowId;
  const from = base.findIndex((w) => w.id === fromId);
  if (from < 0) return layout;
  if (fromId === last.id && after.widgets.length === 1) {
    return base.map((item) =>
      item.id === fromId
        ? { ...omitLegacy(item), id: fromId, colSpan, rowId }
        : omitLegacy(item),
    );
  }
  const dragged = base[from]!;
  const without = base.filter((_, i) => i !== from).map(omitLegacy);
  const lastAt = without.findIndex((w) => w.id === last.id);
  if (lastAt < 0) return layout;
  without.splice(lastAt + 1, 0, {
    id: dragged.id,
    colSpan,
    rowId,
    ...(dragged.heightPx != null ? { heightPx: dragged.heightPx } : {}),
  });
  return without;
}

/**
 * Largest col span this widget's stack can take on its row without
 * pushing same-row neighbors (grow into that row's gap only).
 */
export function maxDashboardStackColSpan(
  layout: DashboardLayout,
  id: DashboardWidgetId,
): DashboardColSpan {
  const stacks = groupDashboardStacks(layout);
  const stack = stacks.find((s) => s.widgets.some((w) => w.id === id));
  if (!stack) return 12;
  const row = packDashboardStackRows(stacks).find((r) =>
    r.stacks.some((s) => s.id === stack.id),
  );
  if (!row) return 12;
  const others = row.stacks
    .filter((s) => s.id !== stack.id)
    .reduce((sum, s) => sum + s.colSpan, 0);
  const available = Math.max(stack.colSpan, 12 - others);
  return (
    [...DASHBOARD_COL_SPANS].reverse().find((span) => span <= available) ??
    stack.colSpan
  );
}

/** Resize a whole stack column; same-row neighbors stay put, gap can grow. */
export function resizeDashboardStack(
  layout: DashboardLayout,
  id: DashboardWidgetId,
  colSpan: DashboardColSpan,
): DashboardLayout {
  const base = ensureDashboardRowIds(layout);
  const widget = base.find((item) => item.id === id);
  if (!widget) return layout;
  const members = new Set(stackMembers(base, widget));
  const maxSpan = maxDashboardStackColSpan(base, id);
  const nextSpan = colSpan <= maxSpan ? colSpan : maxSpan;
  return base.map((item) => {
    const rest = omitLegacy(item);
    if (!members.has(item.id)) return rest;
    return { ...rest, colSpan: nextSpan };
  });
}
