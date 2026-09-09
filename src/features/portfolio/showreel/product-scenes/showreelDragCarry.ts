/**
 * Scripted HTML5 drag for showreel scenes.
 *
 * The dashboard reorder is native drag-and-drop: useDashboardLayoutEditor
 * reads dragstart/dragover/drop and paints its own drop placeholder from the
 * pointer position. A synthetic click can't express that, so the reel used to
 * fake the result with a layout-action dispatch — the widget teleported into
 * its new slot with no drag and no visible drop position.
 *
 * These helpers drive the REAL handlers instead: a constructed DataTransfer
 * carries the drag, dragover is re-fired under the moving pointer so the
 * app's own placeholder tracks it, and drop/dragend commit through the same
 * path a real user hits.
 *
 * Browsers paint no drag image for synthetic events, so the carried card is
 * drawn by the cursor overlay (DashboardDragGhost) instead.
 */

export type ShowreelDragRatio = { x: number; y: number };

/** Live drag handle: the source element plus the DataTransfer carrying it. */
export type ShowreelCarry = { source: Element; data: DataTransfer };

/** What the overlay needs to paint the carried card. */
export type ShowreelCarryView = {
  label: string;
  width: number;
  height: number;
};

export type RectLike = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Matches setDragImage(ghost, 24, 24) in the real onDragStart. */
export const SHOWREEL_GHOST_OFFSET = 24;

const GHOST_MIN_WIDTH = 160;
const GHOST_MAX_WIDTH = 340;
const GHOST_MIN_HEIGHT = 72;
const GHOST_MAX_HEIGHT = 200;

/** Keep the carried card readable without covering half the scene. */
export function clampGhostSize(
  width: number,
  height: number,
): { width: number; height: number } {
  const w = Number.isFinite(width) ? width : GHOST_MIN_WIDTH;
  const h = Number.isFinite(height) ? height : GHOST_MIN_HEIGHT;
  return {
    width: Math.round(Math.min(Math.max(w, GHOST_MIN_WIDTH), GHOST_MAX_WIDTH)),
    height: Math.round(
      Math.min(Math.max(h, GHOST_MIN_HEIGHT), GHOST_MAX_HEIGHT),
    ),
  };
}

/**
 * Point at `ratio` inside `rect`. The drop edge the app resolves comes from
 * where the pointer sits in the target's box (dropEdgeFromRatios), so aiming
 * at 0.22 vs 0.78 of the width is what makes the placeholder open on the left
 * vs the right.
 */
export function ratioPointInRect(
  rect: RectLike,
  ratio: ShowreelDragRatio,
): { x: number; y: number } {
  return {
    x: rect.left + rect.width * ratio.x,
    y: rect.top + rect.height * ratio.y,
  };
}

/** Constructed DataTransfer / DragEvent — both needed to script a drag. */
export function showreelDragSupported(): boolean {
  return (
    typeof DataTransfer === "function" && typeof DragEvent === "function"
  );
}

function dragEvent(
  type: string,
  data: DataTransfer,
  x: number,
  y: number,
): DragEvent {
  return new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    dataTransfer: data,
  });
}

/** Widget label as the app itself renders it (chrome sets aria-label). */
function carryLabel(host: Element): string {
  const listitem = host.querySelector('[role="listitem"]');
  return (
    listitem?.getAttribute("aria-label") ??
    host.getAttribute("data-dash-widget-id") ??
    ""
  );
}

/**
 * Press the drag handle and start a real drag. Returns null when the browser
 * can't construct a DataTransfer — callers fall back to a scripted dispatch.
 */
export function startShowreelDrag(
  handle: Element,
  x: number,
  y: number,
): { carry: ShowreelCarry; view: ShowreelCarryView } | null {
  if (!showreelDragSupported()) return null;
  const host = handle.closest("[data-dash-widget-id]") ?? handle;
  const body = host.querySelector("[data-dash-widget-body]") ?? host;
  const rect = body.getBoundingClientRect();
  const data = new DataTransfer();
  handle.dispatchEvent(dragEvent("dragstart", data, x, y));
  return {
    carry: { source: handle, data },
    view: { label: carryLabel(host), ...clampGhostSize(rect.width, rect.height) },
  };
}

/**
 * Re-fire dragover under the pointer. The app hit-tests with elementFromPoint
 * semantics of its own (whatever is under the cursor handles the event), so
 * the drop placeholder follows the carried card frame by frame.
 */
export function moveShowreelDrag(
  carry: ShowreelCarry,
  x: number,
  y: number,
): void {
  const under = document.elementFromPoint(x, y);
  if (!under) return;
  under.dispatchEvent(dragEvent("dragover", carry.data, x, y));
}

/**
 * Did the two nodes swap document order? Compares two
 * compareDocumentPosition bitmasks, ignoring the containment/disconnected
 * bits — used to confirm a scripted drop actually reordered the layout.
 */
export function documentOrderFlipped(before: number, after: number): boolean {
  const ORDER = 2 /* PRECEDING */ | 4; /* FOLLOWING */
  const from = before & ORDER;
  const to = after & ORDER;
  return from !== 0 && to !== 0 && from !== to;
}

/** Order of `source`'s widget host relative to `target`, as a bitmask. */
export function dragOrderProbe(carry: ShowreelCarry, target: Element): number {
  const host = carry.source.closest("[data-dash-widget-id]") ?? carry.source;
  return host.compareDocumentPosition(target);
}

/** Release over `target`: drop commits the move, dragend clears the drag UI. */
export function finishShowreelDrag(
  carry: ShowreelCarry,
  target: Element,
  x: number,
  y: number,
): void {
  target.dispatchEvent(dragEvent("drop", carry.data, x, y));
  carry.source.dispatchEvent(dragEvent("dragend", carry.data, x, y));
}

/** Teardown mid-carry: never strand the editor holding a phantom widget. */
export function cancelShowreelDrag(carry: ShowreelCarry): void {
  carry.source.dispatchEvent(dragEvent("dragend", carry.data, 0, 0));
}
