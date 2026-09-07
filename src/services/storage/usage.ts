import { createServiceClient } from "@/lib/supabase/service";
import type { StorageBucket } from "@/lib/supabase/upload";
import {
  formatStorageBytes,
  remainingStorageBytes,
  resolveStorageQuotaBytes,
  storageUsageRatio,
  type SupabasePlan,
} from "./quota";
import { sumBucketsBytes } from "./sumBuckets";

export const STORAGE_BUCKETS: StorageBucket[] = [
  "hero",
  "about",
  "projects",
  "clients",
];

export type StorageUsageReport = {
  usedBytes: number;
  quotaBytes: number;
  remainingBytes: number;
  ratio: number;
  plan: SupabasePlan;
  usedLabel: string;
  quotaLabel: string;
  remainingLabel: string;
  percentLabel: string;
};

export async function getStorageUsageReport(): Promise<StorageUsageReport | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }
  try {
    const { plan, quotaBytes } = resolveStorageQuotaBytes({
      plan: process.env.SUPABASE_PLAN,
      overrideBytes: process.env.SUPABASE_STORAGE_QUOTA_BYTES,
    });
    const supabase = createServiceClient();
    const usedBytes = await sumBucketsBytes(supabase, STORAGE_BUCKETS);
    const remainingBytes = remainingStorageBytes(usedBytes, quotaBytes);
    const ratio = storageUsageRatio(usedBytes, quotaBytes);
    return {
      usedBytes,
      quotaBytes,
      remainingBytes,
      ratio,
      plan,
      usedLabel: formatStorageBytes(usedBytes),
      quotaLabel: formatStorageBytes(quotaBytes),
      remainingLabel: formatStorageBytes(remainingBytes),
      percentLabel: `${Math.round(ratio * 100)}%`,
    };
  } catch {
    return null;
  }
}
