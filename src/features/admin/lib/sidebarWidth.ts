export const SIDEBAR_WIDTH_MIN = 180;
export const SIDEBAR_WIDTH_MAX = 360;
export const SIDEBAR_WIDTH_DEFAULT = 220;
export const SIDEBAR_WIDTH_STORAGE_KEY = "admin.sidebarWidth";

export function clampSidebarWidth(value: number): number {
  return Math.min(SIDEBAR_WIDTH_MAX, Math.max(SIDEBAR_WIDTH_MIN, Math.round(value)));
}

/**
 * Sidebar sits before the handle in DOM. In LTR, drag right grows the column.
 * In RTL the visual order flips, so drag right must shrink instead.
 */
export function nextSidebarWidthFromDrag(
  startWidth: number,
  startX: number,
  clientX: number,
  rtl = false,
): number {
  const delta = clientX - startX;
  return clampSidebarWidth(startWidth + (rtl ? -delta : delta));
}

export function readStoredSidebarWidth(): number {
  if (typeof window === "undefined") return SIDEBAR_WIDTH_DEFAULT;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
    if (!raw) return SIDEBAR_WIDTH_DEFAULT;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return SIDEBAR_WIDTH_DEFAULT;
    return clampSidebarWidth(parsed);
  } catch {
    return SIDEBAR_WIDTH_DEFAULT;
  }
}

export function writeStoredSidebarWidth(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SIDEBAR_WIDTH_STORAGE_KEY,
      String(clampSidebarWidth(value)),
    );
  } catch {
    /* ignore quota / private mode */
  }
}
