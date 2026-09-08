export const DASHBOARD_WIDGET_HEIGHT_MIN = 120;
/** Soft default used before viewport measurement. */
export const DASHBOARD_WIDGET_HEIGHT_DEFAULT = 280;
/** Absolute ceiling for persisted values (large monitors / multi-display). */
export const DASHBOARD_WIDGET_HEIGHT_ABS_MAX = 5000;

/** @deprecated Prefer viewportWidgetHeightMax — kept for aria fallbacks. */
export const DASHBOARD_WIDGET_HEIGHT_MAX = DASHBOARD_WIDGET_HEIGHT_ABS_MAX;

export function viewportWidgetHeightMax(
  viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
): number {
  // Nearly full viewport so a widget can fill the visible screen.
  return Math.max(
    DASHBOARD_WIDGET_HEIGHT_MIN,
    Math.round(viewportHeight - 16),
  );
}

export function clampDashboardWidgetHeight(
  value: number,
  max = DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
): number {
  const ceiling = Math.max(DASHBOARD_WIDGET_HEIGHT_MIN, max);
  return Math.min(
    ceiling,
    Math.max(DASHBOARD_WIDGET_HEIGHT_MIN, Math.round(value)),
  );
}

export function nextDashboardWidgetHeightFromDrag(
  startHeight: number,
  startY: number,
  clientY: number,
  max = DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
): number {
  return clampDashboardWidgetHeight(
    startHeight + (clientY - startY),
    max,
  );
}

export function parseDashboardWidgetHeight(
  raw: unknown,
): number | undefined {
  if (typeof raw !== "number" || !Number.isFinite(raw)) return undefined;
  return clampDashboardWidgetHeight(raw);
}
