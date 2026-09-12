import { isProviderId, providerApiKey, type ProviderId } from "./providers";

export type ChainEntry = { provider: ProviderId; model: string };

type Env = Record<string, string | undefined>;

/**
 * The models we try, in order, until one answers.
 *
 * Groq sits at the bottom on purpose. Its free tier is capped per model per
 * day, and running that cap out is what used to take every AI feature down;
 * the stronger providers now absorb the traffic first and Groq is the last
 * resort. Every model here handles Arabic — patients write Egyptian Arabic on
 * WhatsApp — and mistral-saba is in the list specifically for it.
 *
 * Consecutive entries deliberately alternate providers where they can, so a
 * provider-wide outage moves us on rather than down a list of its siblings.
 *
 * Only providers whose free tier renews by itself are here. Anything running
 * on trial credits would quietly stop answering once they ran out.
 */
export const DEFAULT_CHAIN: ChainEntry[] = [
  { provider: "gemini", model: "gemini-3.8-flash" },
  { provider: "mistral", model: "mistral-large-latest" },
  { provider: "gemini", model: "gemini-2.5-flash" },
  { provider: "mistral", model: "mistral-saba-latest" },
  { provider: "groq", model: "openai/gpt-oss-120b" },
  { provider: "groq", model: "qwen/qwen3.8-27b" },
  { provider: "groq", model: "openai/gpt-oss-20b" },
];

/**
 * Read an `AI_MODEL_CHAIN` value: `provider:model` pairs, comma separated.
 *
 * Anything unreadable is dropped rather than thrown, because this runs on a
 * server handling a patient's message: a typo in an env var must cost us one
 * model, not the whole reply.
 */
export function parseModelChain(raw: string | undefined): ChainEntry[] {
  if (!raw) return [];

  const entries: ChainEntry[] = [];
  for (const part of raw.split(",")) {
    const piece = part.trim();
    if (!piece) continue;

    // Split on the first colon only: model ids carry slashes and dots
    // ("openai/gpt-oss-120b") but never a colon.
    const colon = piece.indexOf(":");
    if (colon === -1) continue;

    const provider = piece.slice(0, colon).trim().toLowerCase();
    const model = piece.slice(colon + 1).trim();
    if (!model || !isProviderId(provider)) continue;

    entries.push({ provider, model });
  }
  return entries;
}

/** First occurrence wins, so an override can promote a model already listed. */
function dedupe(chain: ChainEntry[]): ChainEntry[] {
  const seen = new Set<string>();
  return chain.filter((entry) => {
    const key = `${entry.provider}:${entry.model}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** GROQ_MODEL predates the chain and still names the Groq model we prefer. */
function applyGroqModel(chain: ChainEntry[], model: string): ChainEntry[] {
  const first = chain.findIndex((entry) => entry.provider === "groq");
  if (first === -1) return chain;
  return chain.map((entry, i) => (i === first ? { ...entry, model } : entry));
}

/**
 * The chain this environment can actually call.
 *
 * Entries whose provider key is unset are dropped, which is what keeps a
 * deploy holding only GROQ_API_KEY behaving exactly as it did before this
 * feature existed.
 */
export function resolveChain(env: Env = process.env): ChainEntry[] {
  const override = parseModelChain(env.AI_MODEL_CHAIN);
  const groqModel = env.GROQ_MODEL?.trim();

  // An explicit chain is the author's whole intent — GROQ_MODEL does not get to
  // edit it. It only adjusts the default.
  const chain =
    override.length > 0
      ? override
      : groqModel
        ? applyGroqModel(DEFAULT_CHAIN, groqModel)
        : DEFAULT_CHAIN;

  return dedupe(chain).filter((entry) => providerApiKey(entry.provider, env) !== "");
}
