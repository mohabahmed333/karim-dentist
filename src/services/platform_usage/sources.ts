import { createServiceClient } from "@/lib/supabase/service";
import { getStorageUsageReport } from "@/services/storage/usage";
import {
  managementConfig,
  managementGet,
  managementPost,
} from "./management";
import {
  parseApiCountTotals,
  parseDatabaseSizeBytes,
  parseNumericUsage,
  type ApiCountTotals,
} from "./parse";

const DB_SIZE_SQL =
  "select pg_database_size(current_database())::bigint as pg_database_size;";
const MAU_SQL =
  "select count(*)::bigint as mau from auth.users where last_sign_in_at > now() - interval '30 days';";

export async function getStorageUsedBytes(): Promise<number | null> {
  const report = await getStorageUsageReport();
  return report?.usedBytes ?? null;
}

export async function fetchDatabaseSize(): Promise<number | null> {
  const config = managementConfig();
  if (!config) return null;
  const payload = await managementPost(
    `/v1/projects/${config.ref}/database/query`,
    { query: DB_SIZE_SQL },
  );
  return parseDatabaseSizeBytes(payload);
}

export async function fetchEgress(): Promise<number | null> {
  const payload = await fetchAnalytics("usage.api-requests-count");
  return (
    parseNumericUsage(payload, "egress_bytes") ??
    parseNumericUsage(payload, "total_egress") ??
    null
  );
}

export async function fetchMau(): Promise<number | null> {
  const analytics = await fetchAnalytics("usage.api-counts");
  const fromAnalytics =
    parseNumericUsage(analytics, "mau") ??
    parseNumericUsage(analytics, "monthly_active_users");
  if (fromAnalytics !== null) return fromAnalytics;
  const config = managementConfig();
  if (!config) return null;
  const payload = await managementPost(
    `/v1/projects/${config.ref}/database/query`,
    { query: MAU_SQL },
  );
  return parseNumericUsage(payload, "mau");
}

export async function fetchApiCounts(): Promise<ApiCountTotals | null> {
  return parseApiCountTotals(await fetchAnalytics("usage.api-counts"));
}

export async function countAuthUsers(): Promise<number | null> {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (error || !data) return null;
    const listed = data as { users: unknown[]; total?: number };
    return typeof listed.total === "number"
      ? listed.total
      : listed.users.length;
  } catch {
    return null;
  }
}

async function fetchAnalytics(endpoint: string): Promise<unknown | null> {
  const config = managementConfig();
  if (!config) return null;
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({
    iso_timestamp_start: start.toISOString(),
    iso_timestamp_end: end.toISOString(),
  });
  return managementGet(
    `/v1/projects/${config.ref}/analytics/endpoints/${endpoint}?${params}`,
  );
}
