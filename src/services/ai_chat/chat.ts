import { fakeGroqEnabled, fakeGroqReply } from "@/lib/testing/e2eFakes";
// Imported by file rather than through the folder's index: the test resolver
// maps "@/x" straight onto src/x.ts and does not look for a directory index.
import { recordAiUsage, type AiUsageWrite } from "@/services/ai_usage/record";
import {
  ProviderError,
  callProvider,
  type AiMessage,
  type TokenUsage,
} from "./callProvider";
import { isCoolingDown, noteFailure } from "./cooldown";
import { resolveChain } from "./modelChain";
import { providerApiKey, type ProviderId } from "./providers";

export type AiChatInput = {
  messages: AiMessage[];
  temperature?: number;
  responseFormat?: "json_object";
  maxTokens?: number;
  /** Ceiling for any one model. */
  timeoutMs?: number;
  /** Ceiling for the whole chain — what the caller's own route can afford. */
  deadlineMs?: number;
  signal?: AbortSignal;
  /** Injectable for tests. */
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  now?: () => number;
  recordUsage?: (write: AiUsageWrite) => void;
};

export type AiChatResult = {
  content: string;
  /** Which model actually answered — worth recording, it varies by the hour. */
  provider: ProviderId | "fake";
  model: string;
  /** What the answer cost, when the provider said. */
  usage: TokenUsage | null;
};

export type AiChatAttempt = { provider: ProviderId; model: string; reason: string };

/** Every model refused. Carries each failure, because "the AI broke" is useless. */
export class AiChatError extends Error {
  readonly attempts: AiChatAttempt[];

  constructor(message: string, attempts: AiChatAttempt[] = []) {
    super(message);
    this.name = "AiChatError";
    this.attempts = attempts;
  }
}

const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_DEADLINE_MS = 45_000;
/** Below this there is no point starting another model; it would only overrun. */
const MIN_SLICE_MS = 1_000;

const NO_KEY =
  "No AI provider key set — add GEMINI_API_KEY, MISTRAL_API_KEY or GROQ_API_KEY";

/**
 * Ask the chain for an answer, top to bottom, and return the first one given.
 *
 * Each model is tried once. A failure moves to the next — that is the whole
 * design: Groq's free tier caps every model per day, so the response to "this
 * model is spent" is a different model, not a retry.
 */
export async function aiChat(input: AiChatInput): Promise<AiChatResult> {
  // E2E only; see e2eFakes for why this is not gated on NODE_ENV.
  if (fakeGroqEnabled()) {
    return {
      content: fakeGroqReply(input.messages),
      provider: "fake",
      model: "e2e",
      usage: null,
    };
  }

  const env = input.env ?? process.env;
  const now = input.now ?? Date.now;

  const chain = resolveChain(env);
  if (chain.length === 0) throw new AiChatError(NO_KEY);
  if (input.signal?.aborted) throw new AiChatError("cancelled by the caller");

  const deadlineAt = now() + (input.deadlineMs ?? DEFAULT_DEADLINE_MS);
  const perModel = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Models we watched run out are skipped — but if that leaves nothing, ask
  // them anyway. A stale cooldown is a guess; answering nothing is a certainty.
  const ready = chain.filter((entry) => !isCoolingDown(entry, now()));
  const order = ready.length > 0 ? ready : chain;

  // Nobody is waiting on the bookkeeping, and a failure in it must never cost
  // the caller their answer — so it is fire-and-forget, and it cannot throw.
  const record = input.recordUsage ?? ((write: AiUsageWrite) => void recordAiUsage(write));
  const note = (write: AiUsageWrite) => {
    try {
      record(write);
    } catch {
      // Deliberately swallowed.
    }
  };

  const attempts: AiChatAttempt[] = [];
  let deadlineHit = false;

  for (const entry of order) {
    const remaining = deadlineAt - now();
    if (remaining < MIN_SLICE_MS) {
      deadlineHit = true;
      break;
    }

    try {
      const reply = await callProvider({
        provider: entry.provider,
        model: entry.model,
        apiKey: providerApiKey(entry.provider, env),
        messages: input.messages,
        temperature: input.temperature,
        responseFormat: input.responseFormat,
        maxTokens: input.maxTokens,
        timeoutMs: Math.min(perModel, remaining),
        signal: input.signal,
        fetchImpl: input.fetchImpl,
      });
      note({ provider: entry.provider, model: entry.model, usage: reply.usage });
      return {
        content: reply.content,
        provider: entry.provider,
        model: entry.model,
        usage: reply.usage,
      };
    } catch (err) {
      const error =
        err instanceof ProviderError
          ? err
          : new ProviderError(err instanceof Error ? err.message : "failed", entry);

      // The caller gave up: stop, rather than spending their budget on models
      // whose answer nobody is waiting for any more.
      if (error.cancelled) throw new AiChatError(error.message, attempts);

      // Only quota is worth recording. A 5xx or a timeout spends nothing and
      // produces nothing; logging it as usage would make an outage look like
      // heavy traffic on the page.
      if (error.status === 429) {
        note({ provider: entry.provider, model: entry.model, rateLimited: true });
      }

      noteFailure(entry, error, now());
      attempts.push({ provider: entry.provider, model: entry.model, reason: error.message });
    }
  }

  const summary = attempts.map((attempt) => attempt.reason).join("; ");
  throw new AiChatError(
    deadlineHit
      ? `AI deadline reached after ${attempts.length} model(s): ${summary}`
      : `Every model in the chain failed: ${summary}`,
    attempts,
  );
}
