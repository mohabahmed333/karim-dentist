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

export async function getPlatformUsageReport(): Promise<PlatformUsageData> {
  return loadPlatformUsage({
    hasAccessToken: managementConfig() !== null,
    getStorageUsedBytes,
    fetchDatabaseSize,
    fetchEgress,
    fetchMau,
    fetchApiCounts,
    countAuthUsers,
    countKapsoMessages,
  });
}
