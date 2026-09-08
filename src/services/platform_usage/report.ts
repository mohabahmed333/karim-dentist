import { loadPlatformUsage, type PlatformUsageData } from "./load";
import { managementConfig } from "./management";
import {
  countAuthUsers,
  fetchApiCounts,
  fetchDatabaseSize,
  fetchEgress,
  fetchMau,
  getStorageUsedBytes,
} from "./sources";
import { countKapsoMessages } from "./kapso";
import { fetchVercelUsage, vercelConfig } from "./vercel";

export async function getPlatformUsageReport(): Promise<PlatformUsageData> {
  return loadPlatformUsage({
    hasAccessToken: managementConfig() !== null,
    hasVercelToken: vercelConfig() !== null,
    getStorageUsedBytes,
    fetchDatabaseSize,
    fetchEgress,
    fetchMau,
    fetchApiCounts,
    countAuthUsers,
    countKapsoMessages,
    fetchVercelUsage,
  });
}
