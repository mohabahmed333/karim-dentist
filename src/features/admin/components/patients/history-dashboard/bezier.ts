import type { Point } from "./dashboard.types";

export function calculateBezierPathFromRects(
  sourceRect: DOMRectReadOnly,
  targetRect: DOMRectReadOnly,
  containerRect: DOMRectReadOnly,
): string {
  const x1 = sourceRect.right - containerRect.left;
  const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;
  const x2 = targetRect.left - containerRect.left;
  const y2 = targetRect.top + targetRect.height / 2 - containerRect.top;
  const controlX = x1 + (x2 - x1) / 2;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${controlX.toFixed(1)} ${y1.toFixed(1)}, ${controlX.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function calculateBezierPath(
  sourceEl: HTMLElement,
  targetEl: HTMLElement,
  containerEl: HTMLElement,
): string {
  return calculateBezierPathFromRects(
    sourceEl.getBoundingClientRect(),
    targetEl.getBoundingClientRect(),
    containerEl.getBoundingClientRect(),
  );
}

export function midControlBezierPath(from: Point, to: Point): string {
  const midX = ((from.x + to.x) / 2).toFixed(1);
  const midY = ((from.y + to.y) / 2).toFixed(1);
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${midX} ${from.y.toFixed(1)}, ${midX} ${to.y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

export function cubicBezierPath(from: Point, to: Point, pull = 0.46): string {
  const dx = Math.max(72, Math.abs(to.x - from.x) * pull);
  const x1 = (from.x + dx).toFixed(1);
  const x2 = (to.x - dx).toFixed(1);
  return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} C ${x1} ${from.y.toFixed(1)}, ${x2} ${to.y.toFixed(1)}, ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
}

export function boxAnchor(
  box: { left: number; top: number; width: number; height: number },
  side: "left" | "right",
): Point {
  return {
    x: side === "right" ? box.left + box.width : box.left,
    y: box.top + box.height / 2,
  };
}
