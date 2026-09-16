import { isProviderId, providerApiKey, type ProviderId } from "./providers";

export type ChainEntry = { provider: ProviderId; model: string };

type Env = Record<string, string | undefined>;

/**
 * The models we try, in order, until one answers.
 *
 * Patients write Egyptian Arabic on WhatsApp, so within each tier below the
 * order is the strongest-in-Arabic model first. Groq still sits below every
 * other provider regardless of how good its Arabic is: its free tier is
 * capped per model per day, and running that cap out is what used to take
 * every AI feature down, so the generous-cap providers absorb traffic first
 * and Groq stays the last resort.
 *
 * Tier 1 (generous/no known hard cap), ranked by Arabic quality:
 *   1. mistral-saba — Mistral's own model, built specifically for Arabic.
 *   2. Qwen (Cerebras) — heavy Arabic training investment, strong open model.
 *   3-4. Gemini 3.8 / 3.6 flash — Google's broad multilingual strength.
 *   5. mistral-large — strong multilingual flagship, not Arabic-specialized.
 *   6. Llama 3.3 70B, mirrored across Cerebras/SambaNova/OpenRouter — decent
 *      but not Arabic-specialized; three hosts for outage redundancy.
 *   7. DeepSeek, mirrored across SambaNova/OpenRouter — trained overwhelmingly
 *      on English/Chinese data, the weakest Arabic performer of this tier.
 * Tier 2 (Groq, capped), ranked by Arabic quality among themselves:
 *   8. Qwen — Groq's strongest Arabic model, so it leads this tier.
 *   9-10. gpt-oss 120b / 20b, largest first.
 *
 * This ranking is a reasoned estimate from each model family's known design
 * and training emphasis, not a formal Arabic benchmark — AI_MODEL_CHAIN below
 * exists to correct it without a code change if real usage says otherwise.
 *
 * Only providers whose free tier renews by itself are here. Anything running
 * on trial credits would quietly stop answering once they ran out.
 */
export const DEFAULT_CHAIN: ChainEntry[] = [
  { provider: "mistral", model: "mistral-saba-latest" },
  { provider: "cerebras", model: "qwen-3-32b" },
  { provider: "gemini", model: "gemini-3.8-flash" },
  // gemini-2.5-flash was retired by Google (a live 404, "no longer available
  // to new users") — 3.6 is a genuinely different model from the 3.8 entry
  // above, so this slot still buys real redundancy rather than repeating it.
  { provider: "gemini", model: "gemini-3.6-flash" },
  { provider: "mistral", model: "mistral-large-latest" },
  { provider: "cerebras", model: "llama-3.3-70b" },
  { provider: "sambanova", model: "Meta-Llama-3.3-70B-Instruct" },
  { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
  { provider: "sambanova", model: "DeepSeek-V3-0324" },
  { provider: "openrouter", model: "deepseek/deepseek-chat-v3-0324:free" },
  { provider: "groq", model: "qwen/qwen3.8-27b" },
  { provider: "groq", model: "openai/gpt-oss-120b" },
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
