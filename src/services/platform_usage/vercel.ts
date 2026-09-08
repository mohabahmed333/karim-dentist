import { BYTES_PER_GB, BYTES_PER_MB } from "./quota";

const VERCEL_API = "https://api.vercel.com";
const BYTES_PER_KB = 1024;
const USAGE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export type VercelUsageConfig = {
  token: string;
  teamId: string;
  projectId: string;
};

export type VercelUsageTotals = {
  fastDataTransferBytes: number;
  edgeRequests: number;
  functionInvocations: number;
};

export function vercelConfig(): VercelUsageConfig | null {
  const token = (
    process.env.VERCEL_TOKEN ?? process.env.VERCEL_ACCESS_TOKEN
  )?.trim();
  const teamId = process.env.VERCEL_ORG_ID?.trim();
  const projectId = process.env.VERCEL_PROJECT_ID?.trim();
  if (!token || !teamId || !projectId) return null;
  return { token, teamId, projectId };
}

export function parseVercelProjectUsage(
  jsonl: string,
  projectId: string,
): VercelUsageTotals | null {
  const lines = jsonl.split(/\r?\n/);
  const totals: VercelUsageTotals = {
    fastDataTransferBytes: 0,
    edgeRequests: 0,
    functionInvocations: 0,
  };
  let parsed = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    let row: unknown;
    try {
      row = JSON.parse(line);
    } catch {
      continue;
    }
    if (!isRecord(row)) continue;
    parsed += 1;
    if (!chargeBelongsToProject(row, projectId)) continue;
    const metric = classifyService(stringField(row, "ServiceName"));
    if (!metric) continue;
    const quantity = consumedAmount(row);
    if (quantity === null) continue;
    if (metric === "fastDataTransferBytes") {
      totals.fastDataTransferBytes += quantity;
    } else if (metric === "edgeRequests") {
      totals.edgeRequests += quantity;
    } else {
      totals.functionInvocations += quantity;
    }
  }
  if (parsed === 0 && jsonl.trim().length > 0) return null;
  return totals;
}

export async function fetchVercelUsage(): Promise<VercelUsageTotals | null> {
  const config = vercelConfig();
  if (!config) return null;
  const to = new Date();
  const from = new Date(to.getTime() - USAGE_WINDOW_MS);
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
    teamId: config.teamId,
  });
  try {
    const response = await fetch(`${VERCEL_API}/v1/billing/charges?${params}`, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: "application/jsonl",
        "User-Agent": "karim-dentist-admin-usage",
      },
      cache: "no-store",
    });
    if (!response.ok) return null;
    return parseVercelProjectUsage(await response.text(), config.projectId);
  } catch {
    return null;
  }
}

function chargeBelongsToProject(
  row: Record<string, unknown>,
  projectId: string,
): boolean {
  const tags = isRecord(row.Tags) ? row.Tags : {};
  const tagged =
    stringField(tags, "ProjectId") ??
    stringField(tags, "projectId") ??
    stringField(tags, "project_id");
  return tagged === projectId;
}

function classifyService(
  name: string | null,
): keyof VercelUsageTotals | null {
  if (!name) return null;
  const key = name.toLowerCase();
  if (key.includes("fast data transfer") || key === "bandwidth") {
    return "fastDataTransferBytes";
  }
  if (
    (key.includes("edge request") || key.includes("cdn request")) &&
    !key.includes("cpu")
  ) {
    return "edgeRequests";
  }
  if (key.includes("function invocation")) {
    return "functionInvocations";
  }
  return null;
}

function consumedAmount(row: Record<string, unknown>): number | null {
  const quantity = toFiniteNumber(row.ConsumedQuantity);
  if (quantity === null) return null;
  const unit = stringField(row, "ConsumedUnit")?.toLowerCase() ?? "";
  if (
    unit === "gb" ||
    unit === "gib" ||
    unit.includes("gigabyte")
  ) {
    return quantity * BYTES_PER_GB;
  }
  if (unit === "mb" || unit === "mib" || unit.includes("megabyte")) {
    return quantity * BYTES_PER_MB;
  }
  if (unit === "kb" || unit === "kib" || unit.includes("kilobyte")) {
    return quantity * BYTES_PER_KB;
  }
  if (unit === "tb" || unit === "tib" || unit.includes("terabyte")) {
    return quantity * BYTES_PER_GB * 1024;
  }
  if (unit === "b" || unit === "byte" || unit === "bytes") {
    return quantity;
  }
  return quantity;
}

function stringField(
  row: Record<string, unknown>,
  key: string,
): string | null {
  const value = row[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toFiniteNumber(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
