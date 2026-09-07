export function parseChartingFee(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(n) || n < 0) return null;
  return n;
}
