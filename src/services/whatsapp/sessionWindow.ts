const SESSION_MS = 24 * 60 * 60 * 1000;

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
