import type { ProviderId } from "@/services/ai_chat/providers";

/**
 * What a provider publishes as its free-tier ceiling for one model.
 *
 * `null` means "not published", which is a real and common answer — Google
 * states free-tier limits in AI Studio rather than in its docs. Showing no
 * number is honest; inventing one would quietly mislead whoever is deciding
 * whether the clinic needs a paid tier.
 */
export type ModelCap = {
  tokensPerDay: number | null;
  requestsPerDay: number | null;
  tokensPerMonth: number | null;
};

const NONE: ModelCap = {
  tokensPerDay: null,
  requestsPerDay: null,
  tokensPerMonth: null,
};

/** Groq free tier, per model per day — the cap that actually bites here. */
const GROQ_FREE: ModelCap = {
  tokensPerDay: 200_000,
  requestsPerDay: 1_000,
  tokensPerMonth: null,
};

/** Mistral's Experiment tier is a monthly budget rather than a daily one. */
const MISTRAL_EXPERIMENT: ModelCap = {
  tokensPerDay: null,
  requestsPerDay: null,
  tokensPerMonth: 1_000_000_000,
};

const CAPS: Record<string, ModelCap> = {
  "groq:openai/gpt-oss-120b": GROQ_FREE,
  "groq:openai/gpt-oss-20b": GROQ_FREE,
  "groq:qwen/qwen3.8-27b": GROQ_FREE,
  "mistral:mistral-large-latest": MISTRAL_EXPERIMENT,
  "mistral:mistral-saba-latest": MISTRAL_EXPERIMENT,
};

/**
 * The published ceiling for one model, or NONE.
 *
 * Keyed per model rather than per provider: caps differ model by model, and a
 * model nobody has recorded a limit for must not inherit a neighbour's.
 */
export function capFor(provider: ProviderId | string, model: string): ModelCap {
  return CAPS[`${provider}:${model}`] ?? NONE;
}
