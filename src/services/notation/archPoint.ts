import { fdiForUniversalAdult } from "./convert";

type Point = { x: number; y: number; z?: number };

/** Map a world-space click on the fitted arch to an adult FDI code. */
export function fdiFromArchPoint(point: Point): string | null {
  const halfWidth = 3.2;
  const t = Math.max(-1, Math.min(1, point.x / halfWidth));
  const index = Math.round(((t + 1) / 2) * 15);
  const universal = point.y >= 0 ? index + 1 : index + 17;
  return fdiForUniversalAdult(universal);
}

export function universalFromArchPoint(point: Point): number | null {
  const halfWidth = 3.2;
  const t = Math.max(-1, Math.min(1, point.x / halfWidth));
  const index = Math.round(((t + 1) / 2) * 15);
  return point.y >= 0 ? index + 1 : index + 17;
}
