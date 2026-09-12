const OUTCOMES = ["proposed", "confirmed", "cancelled", "failed", "stale"] as const;
export type AuditOutcome = (typeof OUTCOMES)[number];

export type AuditEventRow = { outcome: string; action_kind: string };

/** Pure aggregation over raw ai_action_audit_events rows, so it's testable without a database. */
export function summarizeOutcomes(rows: AuditEventRow[]): Record<AuditOutcome, number> {
  const counts: Record<AuditOutcome, number> = {
    proposed: 0,
    confirmed: 0,
    cancelled: 0,
    failed: 0,
    stale: 0,
  };
  for (const row of rows) {
    if ((OUTCOMES as readonly string[]).includes(row.outcome)) {
      counts[row.outcome as AuditOutcome] += 1;
    }
  }
  return counts;
}

/** Which action kinds fail most, worst first — where to look first when the model keeps getting it wrong. */
export function topFailingActionKinds(
  rows: AuditEventRow[],
  limit = 5,
): { kind: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (row.outcome !== "failed") continue;
    counts.set(row.action_kind, (counts.get(row.action_kind) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Percentage of feedback that was a thumbs up, or null when there's none to rate. */
export function feedbackRate(up: number, down: number): number | null {
  const total = up + down;
  if (total === 0) return null;
  return Math.round((up / total) * 100);
}
