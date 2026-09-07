export function clampComparePosition(value: number): number {
  const clamped = Math.min(100, Math.max(0, value));
  return Math.round(clamped * 10) / 10;
}
