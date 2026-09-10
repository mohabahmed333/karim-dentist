export type ArchToothCenter = {
  id: string;
  x: number;
  y: number;
  z: number;
  /** Explicit arch, when known (e.g. from mesh/material naming). Falls back
      to the y-sign heuristic when omitted — some GLBs (e.g. the current
      arch.glb) don't separate upper/lower along y at all. */
  arch?: "upper" | "lower";
};

const UPPER_UNIVERSAL = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
] as const;
/** Patient left → right (x descending when +x is patient's left). */
const LOWER_UNIVERSAL = [
  17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32,
] as const;

/** Center a run of `count` slots inside a 16-tooth arch (drops wisdoms first). */
export function centeredArchSlots(
  slots: readonly number[],
  count: number,
): number[] {
  if (count <= 0) return [];
  if (count >= slots.length) return [...slots];
  const start = Math.floor((slots.length - count) / 2);
  return slots.slice(start, start + count);
}

/**
 * Assign each fitted tooth mesh a unique adult universal index.
 * Upper: x ascending (patient right → left). Lower: x descending.
 */
export function assignArchUniversals(
  teeth: ArchToothCenter[],
): Map<string, number> {
  const isLower = (t: ArchToothCenter) =>
    t.arch ? t.arch === "lower" : t.y < 0;
  const upper = teeth
    .filter((t) => !isLower(t))
    .sort((a, b) => a.x - b.x || a.z - b.z);
  const lower = teeth
    .filter((t) => isLower(t))
    .sort((a, b) => b.x - a.x || a.z - b.z);

  const out = new Map<string, number>();
  const upperSlots = centeredArchSlots(UPPER_UNIVERSAL, upper.length);
  upper.forEach((t, i) => {
    const u = upperSlots[i];
    if (u != null) out.set(t.id, u);
  });
  const lowerSlots = centeredArchSlots(LOWER_UNIVERSAL, lower.length);
  lower.forEach((t, i) => {
    const u = lowerSlots[i];
    if (u != null) out.set(t.id, u);
  });
  return out;
}
