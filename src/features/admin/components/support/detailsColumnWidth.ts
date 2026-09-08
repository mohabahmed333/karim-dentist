export const DETAILS_WIDTH_MIN = 260;
export const DETAILS_WIDTH_MAX = 480;
export const DETAILS_WIDTH_DEFAULT = 300;
export const DETAILS_WIDTH_STORAGE_KEY = "admin.frontDesk.detailsWidth";

export function clampDetailsWidth(value: number): number {
  return Math.min(
    DETAILS_WIDTH_MAX,
    Math.max(DETAILS_WIDTH_MIN, Math.round(value)),
  );
}

/**
 * Details sits after the handle in DOM (end edge). In LTR, drag right shrinks.
 * In RTL the visual order flips, so drag right grows instead.
 */
export function nextDetailsWidthFromDrag(
  startWidth: number,
  startX: number,
  clientX: number,
  rtl = false,
): number {
  const delta = clientX - startX;
  return clampDetailsWidth(startWidth + (rtl ? delta : -delta));
}

export function readStoredDetailsWidth(): number {
  if (typeof window === "undefined") return DETAILS_WIDTH_DEFAULT;
  try {
    const raw = window.localStorage.getItem(DETAILS_WIDTH_STORAGE_KEY);
    if (!raw) return DETAILS_WIDTH_DEFAULT;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return DETAILS_WIDTH_DEFAULT;
    return clampDetailsWidth(parsed);
  } catch {
    return DETAILS_WIDTH_DEFAULT;
  }
}

export function writeStoredDetailsWidth(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DETAILS_WIDTH_STORAGE_KEY,
      String(clampDetailsWidth(value)),
    );
  } catch {
    /* ignore quota / private mode */
  }
}
