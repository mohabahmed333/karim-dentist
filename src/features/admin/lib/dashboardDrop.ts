import {
  DASHBOARD_COL_SPANS,
  type DashboardColSpan,
} from "./dashboardLayoutCatalog";

export type DashboardDropEdge = "above" | "below" | "left" | "right";

/**
 * Exact two-across pairs that fill a 12-col row:
 * 3+9, 4+8, 6+6, 8+4, 9+3.
 */
export function exactRowPartners(
  span: DashboardColSpan,
): DashboardColSpan[] {
  return DASHBOARD_COL_SPANS.filter((other) => other + span === 12);
}

/** Spans that can share a row with `span` (sum ≤ 12). */
export function compatibleRowSpans(
  span: DashboardColSpan,
): DashboardColSpan[] {
  return DASHBOARD_COL_SPANS.filter((other) => other + span <= 12);
}

/**
 * Pick left/right widths for a shared row.
 * Prefers keeping sizes when they fit; else exact pairs 9+3 / 8+4 / 6+6.
 */
export function resolveRowPairSpans(
  left: DashboardColSpan,
  right: DashboardColSpan,
): { left: DashboardColSpan; right: DashboardColSpan } {
  if (left + right <= 12) return { left, right };

  if (left === 3 || right === 3 || left === 9 || right === 9) {
    return left === 3 || right === 9
      ? { left: 3, right: 9 }
      : { left: 9, right: 3 };
  }
  if (left === 4 || right === 4 || left === 8 || right === 8) {
    return left === 4 || right === 8
      ? { left: 4, right: 8 }
      : { left: 8, right: 4 };
  }
  return { left: 6, right: 6 };
}

/**
 * Drop zone bands: top/bottom strips stack; middle is left/right.
 * Short cards (KPIs) use taller bands so stack drops are easy to hit.
 * Same-row neighbors prefer a thinner vertical band so left/right swap is easy.
 */
export function dropEdgeFromRatios(
  xRatio: number,
  yRatio: number,
  aspectHeightOverWidth = 1,
  preferHorizontal = false,
): DashboardDropEdge {
  const x = Math.min(1, Math.max(0, xRatio));
  const y = Math.min(1, Math.max(0, yRatio));
  if (preferHorizontal) {
    const band = 0.18;
    if (y <= band) return "above";
    if (y >= 1 - band) return "below";
    return x < 0.5 ? "left" : "right";
  }
  const shortCard = aspectHeightOverWidth < 0.75;
  const band = shortCard ? 0.5 : 0.33;
  if (y <= band) return "above";
  if (y >= 1 - band) return "below";
  return x < 0.5 ? "left" : "right";
}

