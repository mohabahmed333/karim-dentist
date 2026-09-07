export type SortableDragGhostState = {
  html: string;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
};

export function captureDragGhost(
  event: React.DragEvent<Element>,
): SortableDragGhostState | null {
  const el = event.currentTarget;
  if (!(el instanceof HTMLElement)) return null;
  const row =
    el.closest<HTMLElement>("[data-sortable-row]") ?? el;
  const rect = row.getBoundingClientRect();
  return {
    html: row.outerHTML,
    width: rect.width,
    height: rect.height,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    x: event.clientX,
    y: event.clientY,
  };
}

/** Hide the browser’s default drag preview so our ghost is the only one. */
export function setTransparentDragImage(event: React.DragEvent) {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  event.dataTransfer.setDragImage(canvas, 0, 0);
}
