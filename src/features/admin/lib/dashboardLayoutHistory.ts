import {
  cloneDashboardLayout,
  type DashboardLayout,
} from "@/features/admin/lib/dashboardLayout";

const HISTORY_LIMIT = 50;

export type LayoutHistory = {
  past: DashboardLayout[];
  future: DashboardLayout[];
};

export function emptyLayoutHistory(): LayoutHistory {
  return { past: [], future: [] };
}

export function pushLayoutHistory(
  history: LayoutHistory,
  current: DashboardLayout,
): LayoutHistory {
  return {
    past: [...history.past, cloneDashboardLayout(current)].slice(
      -HISTORY_LIMIT,
    ),
    future: [],
  };
}

export function undoLayout(
  history: LayoutHistory,
  current: DashboardLayout,
): { history: LayoutHistory; layout: DashboardLayout } | null {
  const prev = history.past[history.past.length - 1];
  if (!prev) return null;
  return {
    layout: cloneDashboardLayout(prev),
    history: {
      past: history.past.slice(0, -1),
      future: [cloneDashboardLayout(current), ...history.future].slice(
        0,
        HISTORY_LIMIT,
      ),
    },
  };
}

export function redoLayout(
  history: LayoutHistory,
  current: DashboardLayout,
): { history: LayoutHistory; layout: DashboardLayout } | null {
  const next = history.future[0];
  if (!next) return null;
  return {
    layout: cloneDashboardLayout(next),
    history: {
      past: [...history.past, cloneDashboardLayout(current)].slice(
        -HISTORY_LIMIT,
      ),
      future: history.future.slice(1),
    },
  };
}

export function layoutsEqual(a: DashboardLayout, b: DashboardLayout): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Compare widget ids + heightPx only (ignore colSpan/rowId drift from DB echo). */
export function layoutHeightsEqual(
  a: DashboardLayout,
  b: DashboardLayout,
): boolean {
  if (a.length !== b.length) return false;
  return a.every((widget, index) => {
    const other = b[index];
    return (
      !!other &&
      widget.id === other.id &&
      widget.heightPx === other.heightPx
    );
  });
}
