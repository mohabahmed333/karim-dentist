export type SpringConfig = { stiffness: number; damping: number };
export type Point = { x: number; y: number };

/** Short hops snap into place; long travels glide. */
const NEAR: SpringConfig = { stiffness: 420, damping: 34 };
const FAR: SpringConfig = { stiffness: 180, damping: 26 };
const FAR_DISTANCE = 900;

/** Spring tuning for a move of `distance` px — looser the further it travels. */
export function springConfigFor(distance: number): SpringConfig {
  const t = Math.min(Math.max(distance, 0), FAR_DISTANCE) / FAR_DISTANCE;
  return {
    stiffness: NEAR.stiffness + (FAR.stiffness - NEAR.stiffness) * t,
    damping: NEAR.damping + (FAR.damping - NEAR.damping) * t,
  };
}

/** True once the pointer is close enough to press without looking off-target. */
export function hasArrived(
  current: Point,
  target: Point,
  tolerance = 4,
): boolean {
  return Math.hypot(target.x - current.x, target.y - current.y) <= tolerance;
}

const MAX_ARC = 42;

/** Lateral bow of the flight path, peaking mid-move. */
export function arcOffset(progress: number, distance: number): number {
  if (progress <= 0 || progress >= 1) return 0;
  const amplitude = Math.min(Math.max(distance, 0) * 0.08, MAX_ARC);
  return Math.sin(progress * Math.PI) * amplitude;
}

const MAX_TILT = 12;
const MIN_TRAVEL = 1;

/** Degrees of lean in the direction of travel, clamped. */
export function tiltFor(dx: number, dy: number): number {
  const distance = Math.hypot(dx, dy);
  if (distance < MIN_TRAVEL) return 0;
  return (dx / distance) * MAX_TILT;
}

const MAGNET_RADIUS = 64;
const MAGNET_GAIN = 1.6;

/** Stiffness multiplier that snaps the pointer in over the last few px. */
export function magnetScale(
  distance: number,
  radius = MAGNET_RADIUS,
  gain = MAGNET_GAIN,
): number {
  const d = Math.max(distance, 0);
  if (d >= radius) return 1;
  return 1 + (gain - 1) * (1 - d / radius);
}
