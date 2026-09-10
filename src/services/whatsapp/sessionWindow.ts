const SESSION_MS = 24 * 60 * 60 * 1000;

export function laterIsoTimestamp(
  a: string | null | undefined,
  b: string | null | undefined,
): string | null {
  const ta = a ? Date.parse(a) : Number.NaN;
  const tb = b ? Date.parse(b) : Number.NaN;
  const aOk = Number.isFinite(ta);
  const bOk = Number.isFinite(tb);
  if (aOk && bOk) return ta >= tb ? (a as string) : (b as string);
  if (aOk) return a as string;
  if (bOk) return b as string;
  return null;
}

export function latestInboundAt(
  stored: string | null | undefined,
  inboundTimes: readonly (string | null | undefined)[],
): string | null {
  let latest = stored ?? null;
  for (const time of inboundTimes) {
    latest = laterIsoTimestamp(latest, time);
  }
  return latest;
}

/** Meta customer-care window: open only while last inbound is strictly under 24h ago. */
export function isWhatsappSessionOpen(
  lastInboundAt: string | null | undefined,
  now: Date = new Date(),
): boolean {
  if (!lastInboundAt) return false;
  const at = new Date(lastInboundAt);
  if (Number.isNaN(at.getTime())) return false;
  return now.getTime() - at.getTime() < SESSION_MS;
}
