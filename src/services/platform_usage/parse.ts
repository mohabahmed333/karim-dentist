export type ApiCountTotals = {
  auth: number;
  rest: number;
  storage: number;
  realtime: number;
  total: number;
};

export function parseDatabaseSizeBytes(payload: unknown): number | null {
  const rows = asRows(payload);
  const first = rows[0];
  if (!first) return null;
  return parseNumericUsage(first, "pg_database_size");
}

export function parseApiCountTotals(payload: unknown): ApiCountTotals | null {
  const rows = asRows(payload);
  if (rows.length === 0) return null;
  const seed = { auth: 0, rest: 0, storage: 0, realtime: 0 };
  const totals = rows.reduce(
    (acc: typeof seed, row) => ({
      auth: acc.auth + numberField(row, "total_auth_requests"),
      rest: acc.rest + numberField(row, "total_rest_requests"),
      storage: acc.storage + numberField(row, "total_storage_requests"),
      realtime: acc.realtime + numberField(row, "total_realtime_requests"),
    }),
    seed,
  );
  return {
    ...totals,
    total: totals.auth + totals.rest + totals.storage + totals.realtime,
  };
}

export function parseNumericUsage(payload: unknown, key: string): number | null {
  if (isRecord(payload) && key in payload) {
    return toFiniteNumber(payload[key]);
  }
  for (const row of asRows(payload)) {
    const value = toFiniteNumber(row[key]);
    if (value !== null) return value;
  }
  return null;
}

function asRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload) && Array.isArray(payload.result)) {
    return payload.result.filter(isRecord);
  }
  return [];
}

function numberField(row: Record<string, unknown>, key: string): number {
  return toFiniteNumber(row[key]) ?? 0;
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
