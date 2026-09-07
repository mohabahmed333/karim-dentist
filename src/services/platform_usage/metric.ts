import { formatStorageBytes } from "@/services/storage/quota";

export type UsageMetricId =
  | "storage"
  | "database"
  | "egress"
  | "authMau"
  | "kapsoMessages";

export type UsageUnit = "bytes" | "count";

export type UsageMetric = {
  id: UsageMetricId;
  status: "ok" | "unavailable";
  used: number;
  quota: number;
  remaining: number;
  ratio: number;
  usedLabel: string;
  remainingLabel: string;
  quotaLabel: string;
  percentLabel: string;
  unit: UsageUnit;
};

export function formatUsageCount(value: number): string {
  return Math.max(0, Math.round(value)).toLocaleString("en-US");
}

export function buildUsageMetric(input: {
  id: UsageMetricId;
  used: number | null;
  quota: number;
  unit: UsageUnit;
}): UsageMetric {
  const quota = Math.max(0, input.quota);
  if (input.used === null) {
    return {
      id: input.id,
      status: "unavailable",
      used: 0,
      quota,
      remaining: quota,
      ratio: 0,
      usedLabel: "",
      remainingLabel: "",
      quotaLabel: label(quota, input.unit),
      percentLabel: "",
      unit: input.unit,
    };
  }
  const used = Math.max(0, input.used);
  const remaining = Math.max(0, quota - used);
  const ratio = quota <= 0 ? 0 : Math.min(1, used / quota);
  return {
    id: input.id,
    status: "ok",
    used,
    quota,
    remaining,
    ratio,
    usedLabel: label(used, input.unit),
    remainingLabel: label(remaining, input.unit),
    quotaLabel: label(quota, input.unit),
    percentLabel: `${Math.round(ratio * 100)}%`,
    unit: input.unit,
  };
}

function label(value: number, unit: UsageUnit): string {
  return unit === "bytes" ? formatStorageBytes(value) : formatUsageCount(value);
}
