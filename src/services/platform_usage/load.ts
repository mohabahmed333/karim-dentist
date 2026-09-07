import { assemblePlatformUsageReport, type PlatformUsageReport } from "./assemble";
import type { ApiCountTotals } from "./parse";

export type AuthUsageSource = "mau" | "users" | "unavailable";

export type PlatformUsageDeps = {
  hasAccessToken: boolean;
  getStorageUsedBytes: () => Promise<number | null>;
  fetchDatabaseSize: () => Promise<number | null>;
  fetchEgress: () => Promise<number | null>;
  fetchMau: () => Promise<number | null>;
  fetchApiCounts: () => Promise<ApiCountTotals | null>;
  countAuthUsers: () => Promise<number | null>;
  countKapsoMessages: () => Promise<number | null>;
};

export type PlatformUsageData = PlatformUsageReport & {
  hasAccessToken: boolean;
  authSource: AuthUsageSource;
  apiCounts: ApiCountTotals | null;
};

export async function loadPlatformUsage(
  deps: PlatformUsageDeps,
): Promise<PlatformUsageData> {
  const storageUsedBytes = await deps.getStorageUsedBytes();
  const databaseUsedBytes = deps.hasAccessToken
    ? await deps.fetchDatabaseSize()
    : null;
  const egressUsedBytes = deps.hasAccessToken ? await deps.fetchEgress() : null;
  const mau = deps.hasAccessToken ? await deps.fetchMau() : null;
  const users = await deps.countAuthUsers();
  const authMauUsed = mau ?? users;
  const authSource: AuthUsageSource =
    mau !== null ? "mau" : users !== null ? "users" : "unavailable";
  const apiCounts = deps.hasAccessToken ? await deps.fetchApiCounts() : null;
  const kapsoMessagesUsed = await deps.countKapsoMessages();
  return {
    ...assemblePlatformUsageReport({
      storageUsedBytes,
      databaseUsedBytes,
      egressUsedBytes,
      authMauUsed,
      kapsoMessagesUsed,
    }),
    hasAccessToken: deps.hasAccessToken,
    authSource,
    apiCounts,
  };
}
