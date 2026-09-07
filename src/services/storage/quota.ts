export const BYTES_PER_GB = 1024 ** 3;

/** Official Supabase file-storage quotas (GB) by plan. */
export const STORAGE_QUOTA_GB_BY_PLAN = {
  free: 1,
  pro: 100,
  team: 100,
  enterprise: 100,
} as const;

export type SupabasePlan = keyof typeof STORAGE_QUOTA_GB_BY_PLAN;

export function normalizeSupabasePlan(raw: string | undefined): SupabasePlan {
  const key = String(raw ?? "free").trim().toLowerCase();
  if (key in STORAGE_QUOTA_GB_BY_PLAN) return key as SupabasePlan;
  return "free";
}

export function quotaBytesForPlan(plan: SupabasePlan): number {
  return STORAGE_QUOTA_GB_BY_PLAN[plan] * BYTES_PER_GB;
}

export function resolveStorageQuotaBytes(options: {
  plan?: string;
  overrideBytes?: number | string;
}): { plan: SupabasePlan; quotaBytes: number } {
  const plan = normalizeSupabasePlan(options.plan);
  const override = Number(options.overrideBytes);
  if (Number.isFinite(override) && override > 0) {
    return { plan, quotaBytes: override };
  }
  return { plan, quotaBytes: quotaBytesForPlan(plan) };
}

export function remainingStorageBytes(usedBytes: number, quotaBytes: number): number {
  return Math.max(0, quotaBytes - Math.max(0, usedBytes));
}

export function storageUsageRatio(usedBytes: number, quotaBytes: number): number {
  if (quotaBytes <= 0) return 0;
  return Math.min(1, Math.max(0, usedBytes) / quotaBytes);
}

export function formatStorageBytes(bytes: number): string {
  const value = Math.max(0, bytes);
  if (value < 1024) return `${Math.round(value)} B`;
  const units = ["KB", "MB", "GB", "TB"] as const;
  let n = value / 1024;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const digits = n >= 10 ? 0 : 1;
  return `${n.toFixed(digits)} ${units[i]}`;
}
