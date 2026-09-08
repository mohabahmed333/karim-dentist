export const INBOX_WIDTH_MIN = 300;
export const INBOX_WIDTH_MAX = 560;
export const INBOX_WIDTH_DEFAULT = 380;
export const INBOX_WIDTH_STORAGE_KEY = "admin.frontDesk.inboxWidth";

export function clampInboxWidth(value: number): number {
  return Math.min(INBOX_WIDTH_MAX, Math.max(INBOX_WIDTH_MIN, Math.round(value)));
}

/**
 * Inbox sits before the handle in DOM. In LTR, drag right grows the column.
 * In RTL the visual order flips, so drag right must shrink instead.
 */
export function nextInboxWidthFromDrag(
  startWidth: number,
  startX: number,
  clientX: number,
  rtl = false,
): number {
  const delta = clientX - startX;
  return clampInboxWidth(startWidth + (rtl ? -delta : delta));
}

export function readStoredInboxWidth(): number {
  if (typeof window === "undefined") return INBOX_WIDTH_DEFAULT;
  try {
    const raw = window.localStorage.getItem(INBOX_WIDTH_STORAGE_KEY);
    if (!raw) return INBOX_WIDTH_DEFAULT;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return INBOX_WIDTH_DEFAULT;
    return clampInboxWidth(parsed);
  } catch {
    return INBOX_WIDTH_DEFAULT;
  }
}

export function writeStoredInboxWidth(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      INBOX_WIDTH_STORAGE_KEY,
      String(clampInboxWidth(value)),
    );
  } catch {
    /* ignore quota / private mode */
  }
}
