/** Pointer near top/bottom of a scrollport → scroll delta (px this frame). */
export function scrollDeltaForDragEdge(
  clientY: number,
  containerTop: number,
  containerBottom: number,
  edgePx = 72,
  maxSpeed = 28,
): number {
  const height = containerBottom - containerTop;
  if (height <= 0 || edgePx <= 0 || maxSpeed <= 0) return 0;
  const zone = Math.min(edgePx, height / 2);

  if (clientY < containerTop + zone) {
    const t = (containerTop + zone - clientY) / zone;
    return -Math.ceil(maxSpeed * Math.min(1, Math.max(0, t)));
  }
  if (clientY > containerBottom - zone) {
    const t = (clientY - (containerBottom - zone)) / zone;
    return Math.ceil(maxSpeed * Math.min(1, Math.max(0, t)));
  }
  return 0;
}

/** Nearest ancestor that can scroll vertically (or the scrolling documentElement). */
export function findVerticalScrollParent(
  start: Element | null,
): HTMLElement | null {
  let node: Element | null = start;
  while (node && node instanceof HTMLElement) {
    const { overflowY } = getComputedStyle(node);
    const canScroll =
      (overflowY === "auto" ||
        overflowY === "scroll" ||
        overflowY === "overlay") &&
      node.scrollHeight > node.clientHeight + 1;
    if (canScroll) return node;
    node = node.parentElement;
  }
  const root = document.scrollingElement;
  return root instanceof HTMLElement ? root : null;
}

/** rAF loop: hold pointer near the scrollport edge to keep scrolling while dragging. */
export function createDragAutoScroll() {
  let scroller: HTMLElement | null = null;
  let lastY = 0;
  let raf = 0;
  let active = false;

  function tick() {
    if (!active || !scroller) return;
    const rect = scroller.getBoundingClientRect();
    const delta = scrollDeltaForDragEdge(lastY, rect.top, rect.bottom);
    if (delta !== 0) scroller.scrollTop += delta;
    raf = requestAnimationFrame(tick);
  }

  function onDocDragOver(event: globalThis.DragEvent) {
    lastY = event.clientY;
  }

  return {
    notePointer(clientY: number) {
      lastY = clientY;
    },
    start(fromEl: Element | null) {
      scroller = findVerticalScrollParent(fromEl);
      if (!scroller || active) return;
      active = true;
      document.addEventListener("dragover", onDocDragOver);
      raf = requestAnimationFrame(tick);
    },
    stop() {
      if (!active) return;
      active = false;
      document.removeEventListener("dragover", onDocDragOver);
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      scroller = null;
    },
  };
}
