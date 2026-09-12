import { fakeGroqEnabled, fakeGroqReply } from "@/lib/testing/e2eFakes";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

/** Groq is OpenAI-compatible, so the request shape follows that API. */
export type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GroqChatInput = {
  apiKey: string;
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  responseFormat?: "json_object";
  maxTokens?: number;
  /** Total attempts including the first. Only 429/5xx are retried. */
  attempts?: number;
  retryDelayMs?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

export class GroqError extends Error {
  readonly status: number | null;
  /** Groq's own error code, e.g. "json_validate_failed". */
  readonly code: string | null;
  /**
   * What the model actually produced when Groq rejected it as invalid JSON.
   * Kept whole: it is the only evidence of why a reply failed, and it may still
   * contain a usable answer.
   */
  readonly failedGeneration: string | null;
  constructor(
    message: string,
    status: number | null = null,
    details: { code?: string | null; failedGeneration?: string | null } = {},
  ) {
    super(message);
    this.name = "GroqError";
    this.status = status;
    this.code = details.code ?? null;
    this.failedGeneration = details.failedGeneration ?? null;
  }
}

/** Groq's structured error fields, when the body carries them. */
function parseGroqErrorDetail(detail: string): {
  code: string | null;
  failedGeneration: string | null;
} {
  try {
    const parsed = JSON.parse(detail) as {
      error?: { code?: unknown; failed_generation?: unknown };
    };
    return {
      code: typeof parsed.error?.code === "string" ? parsed.error.code : null,
      failedGeneration:
        typeof parsed.error?.failed_generation === "string"
          ? parsed.error.failed_generation
          : null,
    };
  } catch {
    return { code: null, failedGeneration: null };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Single entry point for Groq chat completions.
 *
 * Previously three call sites hand-rolled this with no timeout, no retry and no
 * token cap, so a hung Groq call hung the request. That matters most inside the
 * WhatsApp webhook, which the provider retries on timeout.
 */
export async function groqChat(input: GroqChatInput): Promise<string> {
  // E2E only; see e2eFakes for why this is not gated on NODE_ENV.
  if (fakeGroqEnabled()) return fakeGroqReply(input.messages);

  const apiKey = input.apiKey?.trim();
  if (!apiKey) throw new GroqError("Missing GROQ_API_KEY");

  const doFetch = input.fetchImpl ?? fetch;
  const attempts = Math.max(1, input.attempts ?? 3);
  const retryDelayMs = input.retryDelayMs ?? 400;
  const timeoutMs = input.timeoutMs ?? 20_000;

  const body: Record<string, unknown> = {
    model: input.model ?? process.env.GROQ_MODEL ?? DEFAULT_MODEL,
    messages: input.messages,
  };
  if (input.temperature !== undefined) body.temperature = input.temperature;
  if (input.responseFormat) body.response_format = { type: input.responseFormat };
  if (input.maxTokens !== undefined) body.max_tokens = input.maxTokens;

  let lastError: GroqError = new GroqError("Groq request failed");

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const timeout = AbortSignal.timeout(timeoutMs);
    const signal = input.signal
      ? AbortSignal.any([input.signal, timeout])
      : timeout;

    try {
      const response = await doFetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        lastError = new GroqError(
          `Groq error ${response.status}: ${detail.slice(0, 200)}`,
          response.status,
          parseGroqErrorDetail(detail),
        );
        // A 4xx other than 429 is our bug; retrying only burns budget.
        if (!isRetryable(response.status)) throw lastError;
      } else {
        const payload = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
        };
        const content = payload.choices?.[0]?.message?.content?.trim();
        if (!content) throw new GroqError("Groq returned an empty completion");
        return content;
      }
    } catch (err) {
      if (err instanceof GroqError) {
        if (err.status !== null && !isRetryable(err.status)) throw err;
        lastError = err;
      } else if (err instanceof Error && err.name === "AbortError") {
        // The caller's own signal wins; only our timeout is retryable.
        if (input.signal?.aborted) throw new GroqError("Groq request cancelled");
        lastError = new GroqError(`Groq request timed out after ${timeoutMs}ms`);
      } else {
        lastError = new GroqError(
          err instanceof Error ? err.message : "Groq request failed",
        );
      }
    }

    if (attempt < attempts) await sleep(retryDelayMs * attempt);
  }

  throw lastError;
}
