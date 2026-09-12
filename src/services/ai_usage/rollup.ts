import type { ChainEntry } from "@/services/ai_chat/modelChain";
import { capFor } from "./caps";

/** One day's spend on one model, as stored in ai_usage_daily. */
export type AiUsageRow = {
  provider: string;
  model: string;
  requests: number;
  promptTokens: number;
  completionTokens: number;
  rateLimitedCount: number;
  lastRateLimitedAt: string | null;
};

export type AiUsageStatus = "idle" | "active" | "rate_limited";

export type AiUsageLine = {
  id: string;
  provider: string;
  model: string;
  /** False for a model that spent tokens today but has since left the chain. */
  inChain: boolean;
  requests: number;
  tokens: number;
  capTokens: number | null;
  ratio: number | null;
  status: AiUsageStatus;
  lastRateLimitedAt: string | null;
};

export type AiUsageRollup = {
  lines: AiUsageLine[];
  totals: { requests: number; tokens: number };
};

const keyOf = (provider: string, model: string) => `${provider}:${model}`;

function lineFor(
  provider: string,
  model: string,
  inChain: boolean,
  row: AiUsageRow | undefined,
): AiUsageLine {
  const requests = row?.requests ?? 0;
  const tokens = (row?.promptTokens ?? 0) + (row?.completionTokens ?? 0);

  // Only a daily cap is comparable to a day's spend. Mistral's monthly budget
  // is real but measuring today against it would read as near-zero forever.
  const capTokens = capFor(provider, model).tokensPerDay;
  const ratio = capTokens ? Math.min(1, tokens / capTokens) : null;

  const rateLimited = Boolean(row?.lastRateLimitedAt) || (row?.rateLimitedCount ?? 0) > 0;
  const status: AiUsageStatus = rateLimited
    ? "rate_limited"
    : requests > 0 || tokens > 0
      ? "active"
      : "idle";

  return {
    id: keyOf(provider, model),
    provider,
    model,
    inChain,
    requests,
    tokens,
    capTokens,
    ratio,
    status,
    lastRateLimitedAt: row?.lastRateLimitedAt ?? null,
  };
}

/**
 * Turn a day's rows into the section the usage page renders.
 *
 * Chain order, top to bottom, so the page reads the way the fallback actually
 * runs: what answered first, what it fell through to, and what has not been
 * needed. Models no longer in the chain still appear, after it — they spent
 * real quota today and hiding them would misreport the day.
 */
export function rollUpAiUsage(input: {
  chain: ChainEntry[];
  rows: AiUsageRow[];
}): AiUsageRollup {
  const byKey = new Map(input.rows.map((row) => [keyOf(row.provider, row.model), row]));

  const inChain = input.chain.map((entry) =>
    lineFor(entry.provider, entry.model, true, byKey.get(keyOf(entry.provider, entry.model))),
  );

  const chainKeys = new Set(inChain.map((line) => line.id));
  const strays = input.rows
    .filter((row) => !chainKeys.has(keyOf(row.provider, row.model)))
    .map((row) => lineFor(row.provider, row.model, false, row));

  const lines = [...inChain, ...strays];
  return {
    lines,
    totals: {
      requests: lines.reduce((sum, line) => sum + line.requests, 0),
      tokens: lines.reduce((sum, line) => sum + line.tokens, 0),
    },
  };
}
