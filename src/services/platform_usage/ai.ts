import { createServiceClient } from "@/lib/supabase/service";
import type { AiUsageRow } from "@/services/ai_usage";

type StoredRow = {
  provider: string;
  model: string;
  requests: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  rate_limited_count: number | null;
  last_rate_limited_at: string | null;
};

/**
 * A structural view of the client.
 *
 * `ai_usage_daily` postdates the generated Supabase types; this cast goes away
 * the next time they are regenerated, after the migration is applied.
 */
type UsageReader = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => Promise<{ data: StoredRow[] | null; error: unknown }>;
    };
  };
};

const COLUMNS =
  "provider,model,requests,prompt_tokens,completion_tokens,rate_limited_count,last_rate_limited_at";

/** The UTC day the recording RPC writes against. */
export function utcToday(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Today's spend per model, or null when it cannot be read.
 *
 * Null rather than an empty list: "the table is not there yet" and "nothing
 * has been asked of the models today" look identical otherwise, and the page
 * says different things about each.
 */
export async function fetchAiUsageToday(): Promise<AiUsageRow[] | null> {
  try {
    const client = createServiceClient() as unknown as UsageReader;
    const { data, error } = await client
      .from("ai_usage_daily")
      .select(COLUMNS)
      .eq("day", utcToday());
    if (error) return null;
    return (data ?? []).map((row) => ({
      provider: row.provider,
      model: row.model,
      requests: row.requests ?? 0,
      promptTokens: row.prompt_tokens ?? 0,
      completionTokens: row.completion_tokens ?? 0,
      rateLimitedCount: row.rate_limited_count ?? 0,
      lastRateLimitedAt: row.last_rate_limited_at,
    }));
  } catch {
    return null;
  }
}
