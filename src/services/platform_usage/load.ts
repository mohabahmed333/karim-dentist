import { resolveChain, type ChainEntry } from "@/services/ai_chat/modelChain";
import {
  rollUpAiUsage,
  type AiUsageRollup,
  type AiUsageRow,
} from "@/services/ai_usage/rollup";
import { assemblePlatformUsageReport, type PlatformUsageReport } from "./assemble";
import type { ApiCountTotals } from "./parse";
import type { VercelUsageTotals } from "./vercel";

export type AuthUsageSource = "mau" | "users" | "unavailable";

export type PlatformUsageDeps = {
  hasAccessToken: boolean;
  hasVercelToken: boolean;
  getStorageUsedBytes: () => Promise<number | null>;
  fetchDatabaseSize: () => Promise<number | null>;
  fetchEgress: () => Promise<number | null>;
  fetchMau: () => Promise<number | null>;
  fetchApiCounts: () => Promise<ApiCountTotals | null>;
  countAuthUsers: () => Promise<number | null>;
  countKapsoMessages: () => Promise<number | null>;
  fetchVercelUsage: () => Promise<VercelUsageTotals | null>;
  /** Optional so the older callers and their tests keep working untouched. */
  fetchAiUsageToday?: () => Promise<AiUsageRow[] | null>;
  getAiChain?: () => ChainEntry[];
};

export type PlatformUsageData = PlatformUsageReport & {
  hasAccessToken: boolean;
  hasVercelToken: boolean;
  authSource: AuthUsageSource;
  apiCounts: ApiCountTotals | null;
  aiUsage: AiUsageRollup | null;
};

export async function loadPlatformUsage(
  deps: PlatformUsageDeps,
): Promise<PlatformUsageData> {
  const [
    storageUsedBytes,
    databaseUsedBytes,
    egressUsedBytes,
    mau,
    users,
    apiCounts,
    kapsoMessagesUsed,
    vercel,
    aiRows,
  ] = await Promise.all([
    deps.getStorageUsedBytes(),
    deps.hasAccessToken ? deps.fetchDatabaseSize() : Promise.resolve(null),
    deps.hasAccessToken ? deps.fetchEgress() : Promise.resolve(null),
    deps.hasAccessToken ? deps.fetchMau() : Promise.resolve(null),
    deps.countAuthUsers(),
    deps.hasAccessToken ? deps.fetchApiCounts() : Promise.resolve(null),
    deps.countKapsoMessages(),
    deps.hasVercelToken ? deps.fetchVercelUsage() : Promise.resolve(null),
    // Null means the rows could not be read at all — which the page says
    // differently from "no model has been asked anything today".
    deps.fetchAiUsageToday?.() ?? Promise.resolve(null),
  ]);
  const authMauUsed = mau ?? users;
  const authSource: AuthUsageSource =
    mau !== null ? "mau" : users !== null ? "users" : "unavailable";
  const aiUsage =
    aiRows === null
      ? null
      : rollUpAiUsage({ chain: (deps.getAiChain ?? resolveChain)(), rows: aiRows });

  return {
    ...assemblePlatformUsageReport({
      storageUsedBytes,
      databaseUsedBytes,
      egressUsedBytes,
      authMauUsed,
      kapsoMessagesUsed,
      vercelFastDataTransferBytes: vercel?.fastDataTransferBytes ?? null,
      vercelEdgeRequests: vercel?.edgeRequests ?? null,
      vercelFunctionInvocations: vercel?.functionInvocations ?? null,
    }),
    hasAccessToken: deps.hasAccessToken,
    hasVercelToken: deps.hasVercelToken,
    authSource,
    apiCounts,
    aiUsage,
  };
}
