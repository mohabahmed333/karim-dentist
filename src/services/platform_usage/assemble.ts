import { buildUsageMetric, type UsageMetric } from "./metric";
import { freePlanQuotas } from "./quota";

export type PlatformUsageSources = {
  storageUsedBytes: number | null;
  databaseUsedBytes: number | null;
  egressUsedBytes: number | null;
  authMauUsed: number | null;
  kapsoMessagesUsed: number | null;
};

export type PlatformUsageReport = {
  plan: "free";
  metrics: UsageMetric[];
};

export function assemblePlatformUsageReport(
  sources: PlatformUsageSources,
): PlatformUsageReport {
  const quotas = freePlanQuotas();
  return {
    plan: "free",
    metrics: [
      buildUsageMetric({
        id: "storage",
        used: sources.storageUsedBytes,
        quota: quotas.storageBytes,
        unit: "bytes",
      }),
      buildUsageMetric({
        id: "database",
        used: sources.databaseUsedBytes,
        quota: quotas.databaseBytes,
        unit: "bytes",
      }),
      buildUsageMetric({
        id: "egress",
        used: sources.egressUsedBytes,
        quota: quotas.egressBytes,
        unit: "bytes",
      }),
      buildUsageMetric({
        id: "authMau",
        used: sources.authMauUsed,
        quota: quotas.authMau,
        unit: "count",
      }),
      buildUsageMetric({
        id: "kapsoMessages",
        used: sources.kapsoMessagesUsed,
        quota: quotas.kapsoMessages,
        unit: "count",
      }),
    ],
  };
}
