import { parseModelChain, type ChainEntry } from "./modelChain";
import { providerApiKey } from "./providers";

type Env = Record<string, string | undefined>;

/**
 * The models we try when a call includes an image.
 *
 * This is a separate list rather than a filter over `DEFAULT_CHAIN` because
 * reading an image is a different capability from answering in Arabic, and the
 * default chain is chosen for the latter. Four of its seven entries cannot see
 * at all — Groq exposes no vision model on this account, and mistral-saba is
 * text-only — so filtering it would leave nothing but Google and hide the fact
 * that one provider outage takes the feature down.
 *
 * Verified live against the keys this project uses: both Gemini entries accept
 * OpenAI-style `image_url` parts through the same chat-completions endpoint the
 * text path already calls. `mistral-medium-latest` is Mistral's multimodal
 * model and sits here as the only non-Google fallback; its image support was
 * rate-limited when checked, so treat it as unconfirmed until a real receipt
 * has gone through it.
 *
 * Order matters the same way it does in the default chain: alternate providers
 * where possible so a provider-wide outage moves us on rather than down a list
 * of its siblings.
 */
export const VISION_CHAIN: ChainEntry[] = [
  { provider: "gemini", model: "gemini-3.8-flash" },
  { provider: "mistral", model: "mistral-medium-latest" },
  { provider: "gemini", model: "gemini-3.6-flash" },
];

/**
 * The vision models this environment can actually call.
 *
 * Empty is a meaningful answer, not a failure: a deploy holding only
 * GROQ_API_KEY has models but no eyes. Callers must check for empty and say so
 * — reading a receipt with no vision model is a staff queue, not an error.
 *
 * `AI_VISION_CHAIN` overrides the list, in the same `provider:model,…` form as
 * `AI_MODEL_CHAIN`. It is deliberately a separate variable: someone pinning the
 * text chain to a cheap model must not thereby blind the receipt reader.
 */
export function resolveVisionChain(env: Env = process.env): ChainEntry[] {
  const override = parseModelChain(env.AI_VISION_CHAIN);
  const chain = override.length > 0 ? override : VISION_CHAIN;

  const seen = new Set<string>();
  return chain.filter((entry) => {
    const key = `${entry.provider}:${entry.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return providerApiKey(entry.provider, env) !== "";
  });
}

/**
 * The resolved vision chain in `AI_MODEL_CHAIN` form.
 *
 * This is how a caller selects vision models without `aiChat` needing to know
 * they exist: pass `env: { ...process.env, AI_MODEL_CHAIN: visionChainString() }`
 * and `resolveChain` honours it as an explicit override. Keeps the fallback
 * loop, the provider cooldowns, the deadline slicing and the usage recording
 * that a bespoke one-model client would have to reimplement.
 */
export function visionChainString(env: Env = process.env): string {
  return resolveVisionChain(env)
    .map((entry) => `${entry.provider}:${entry.model}`)
    .join(",");
}
