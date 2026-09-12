import { createServiceClient } from "@/lib/supabase/service";
import type { TokenUsage } from "@/services/ai_chat/callProvider";

/** The slice of the Supabase client this needs, so tests can stand it in. */
type RpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>;
};

export type AiUsageWrite = {
  provider: string;
  model: string;
  /** Null when the provider reported nothing — recorded as unknown, not zero. */
  usage?: TokenUsage | null;
  /** True when the model refused for quota rather than answering. */
  rateLimited?: boolean;
};

/** Absent configuration is normal locally and in tests, not an error. */
function defaultClient(): RpcClient | null {
  try {
    return createServiceClient() as unknown as RpcClient;
  } catch {
    return null;
  }
}

/**
 * Add one call to today's row for a model.
 *
 * Fire-and-forget by design, and silent on every failure: the patient's reply
 * has already gone out by the time this runs, and a bookkeeping problem must
 * never turn into a failed answer. The row is the nice-to-have; the reply is
 * not.
 */
export async function recordAiUsage(
  write: AiUsageWrite,
  deps: { client?: RpcClient | null } = {},
): Promise<void> {
  const client = deps.client === undefined ? defaultClient() : deps.client;
  if (!client) return;

  // A refusal is not a served request: counting it as one would overstate the
  // day and hide the fact that the model produced nothing.
  const rateLimited = write.rateLimited === true;

  try {
    await client.rpc("record_ai_usage", {
      p_provider: write.provider,
      p_model: write.model,
      p_requests: rateLimited ? 0 : 1,
      p_prompt_tokens: write.usage?.promptTokens ?? 0,
      p_completion_tokens: write.usage?.completionTokens ?? 0,
      p_rate_limited: rateLimited ? 1 : 0,
    });
  } catch {
    // Deliberately swallowed — see above.
  }
}
