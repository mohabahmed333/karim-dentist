/**
 * The model providers we can call.
 *
 * All four speak the OpenAI chat-completions shape with a bearer token, which
 * is the only reason one caller can walk a chain across them. Each has its own
 * key and its own free-tier quota — that independence is the point: when one
 * provider's quota is gone the next one's is untouched.
 */
export type ProviderId = "gemini" | "mistral" | "cerebras" | "groq";

export type Provider = {
  id: ProviderId;
  /** How the provider is named to staff, in setup copy and error messages. */
  label: string;
  envKey: string;
  url: string;
};

type Env = Record<string, string | undefined>;

export const PROVIDERS: Record<ProviderId, Provider> = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    envKey: "GEMINI_API_KEY",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
  },
  mistral: {
    id: "mistral",
    label: "Mistral",
    envKey: "MISTRAL_API_KEY",
    url: "https://api.mistral.ai/v1/chat/completions",
  },
  cerebras: {
    id: "cerebras",
    label: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
    url: "https://api.cerebras.ai/v1/chat/completions",
  },
  groq: {
    id: "groq",
    label: "Groq",
    envKey: "GROQ_API_KEY",
    url: "https://api.groq.com/openai/v1/chat/completions",
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[];

export function isProviderId(value: string): value is ProviderId {
  return Object.hasOwn(PROVIDERS, value);
}

/**
 * The provider's key, or "" when it is unusable.
 *
 * Trimmed because a key pasted into Vercel with a trailing newline would
 * otherwise be sent as-is and rejected as malformed on every single call.
 */
export function providerApiKey(id: ProviderId, env: Env = process.env): string {
  return env[PROVIDERS[id].envKey]?.trim() ?? "";
}

/** Whether any model at all can be reached — the gate the AI features check. */
export function hasAnyAiKey(env: Env = process.env): boolean {
  return PROVIDER_IDS.some((id) => providerApiKey(id, env) !== "");
}
