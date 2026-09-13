import { unstable_cache } from "next/cache";
import { getPlatformUsageReport } from "./report";

/**
 * getPlatformUsageReport() fans out to 8 external calls (Supabase
 * Management API, Analytics, a recursive storage-bucket walk, Vercel
 * billing, several Postgres counts) — none of which change meaningfully
 * within a minute. unstable_cache() lets repeat visits reuse that result
 * instead of re-running the whole fan-out on every page load.
 */
export const getCachedPlatformUsageReport = unstable_cache(
  getPlatformUsageReport,
  ["platform-usage-report"],
  { revalidate: 60 },
);
