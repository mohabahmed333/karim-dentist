import { PROVIDERS, type ProviderId } from "./providers";

export type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ProviderCallInput = {
  provider: ProviderId;
  model: string;
  apiKey: string;
  messages: AiMessage[];
  temperature?: number;
  responseFormat?: "json_object";
  maxTokens?: number;
  timeoutMs?: number;
  /** The caller giving up — distinct from our own timeout. */
  signal?: AbortSignal;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
};

/**
 * One model's refusal to answer.
 *
 * Everything the chain needs to decide what to do next is on here: `status`
 * and `detail` say why, `retryAfterMs` says for how long, and `cancelled`
 * separates "the caller walked away" (stop everything) from "this model
 * failed" (try the next one).
 */
export class ProviderError extends Error {
  readonly provider: ProviderId;
  readonly model: string;
  readonly status: number | null;
  readonly retryAfterMs: number | null;
  readonly detail: string;
  readonly cancelled: boolean;
  /** The provider's own error code, e.g. Groq's "json_validate_failed". */
  readonly code: string | null;
  /**
   * What the model actually produced when the provider rejected it as invalid
   * JSON. Kept whole: it is the only evidence of why a reply failed, and it may
   * still contain a usable answer.
   */
  readonly failedGeneration: string | null;

  constructor(
    reason: string,
    init: {
      provider: ProviderId;
      model: string;
      status?: number | null;
      retryAfterMs?: number | null;
      detail?: string;
      cancelled?: boolean;
      code?: string | null;
      failedGeneration?: string | null;
    },
  ) {
    super(`${init.provider}:${init.model} — ${reason}`);
    this.name = "ProviderError";
    this.provider = init.provider;
    this.model = init.model;
    this.status = init.status ?? null;
    this.retryAfterMs = init.retryAfterMs ?? null;
    this.detail = init.detail ?? "";
    this.cancelled = init.cancelled ?? false;
    this.code = init.code ?? null;
    this.failedGeneration = init.failedGeneration ?? null;
  }
}

const DEFAULT_TIMEOUT_MS = 20_000;
/** Enough of the body to read the limit that was hit, not enough to spam logs. */
const DETAIL_LIMIT = 300;

/**
 * The structured fields a provider puts in an error body.
 *
 * Parsed from the whole body, before `detail` is truncated for logs: a failed
 * generation is routinely longer than that excerpt, and truncating first would
 * leave a fragment nobody can use.
 */
function parseErrorBody(body: string): {
  code: string | null;
  failedGeneration: string | null;
} {
  try {
    const parsed = JSON.parse(body) as {
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

/** `retry-after` is seconds or an HTTP date; anything else is not worth trusting. */
function parseRetryAfter(header: string | null, now: number): number | null {
  if (!header) return null;
  const seconds = Number(header.trim());
  if (Number.isFinite(seconds) && seconds >= 0) return Math.round(seconds * 1000);
  const at = Date.parse(header);
  if (Number.isNaN(at)) return null;
  return Math.max(0, at - now);
}

/**
 * Call one model, once.
 *
 * Deliberately no retry loop: a model that just failed is the worst candidate
 * for the next attempt, and the chain above has eight others to reach for.
 */
export async function callProvider(input: ProviderCallInput): Promise<string> {
  const { provider, model } = input;
  const fail = (reason: string, extra: Partial<ConstructorParameters<typeof ProviderError>[1]> = {}) =>
    new ProviderError(reason, { provider, model, ...extra });

  const apiKey = input.apiKey?.trim();
  if (!apiKey) throw fail(`${PROVIDERS[provider].envKey} is not set`);

  // An already-aborted signal would never fire 'abort' again, so a listener
  // registered below would wait forever. Check before going near fetch.
  if (input.signal?.aborted) throw fail("cancelled by the caller", { cancelled: true });

  const doFetch = input.fetchImpl ?? fetch;
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const body: Record<string, unknown> = { model, messages: input.messages };
  if (input.temperature !== undefined) body.temperature = input.temperature;
  if (input.responseFormat) body.response_format = { type: input.responseFormat };
  // Only ever max_tokens, never max_completion_tokens alongside it: some
  // providers reject a request carrying both, and all of ours accept this one.
  if (input.maxTokens !== undefined) body.max_tokens = input.maxTokens;

  const timeout = AbortSignal.timeout(timeoutMs);
  const signal = input.signal ? AbortSignal.any([input.signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await doFetch(PROVIDERS[provider].url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      if (input.signal?.aborted) throw fail("cancelled by the caller", { cancelled: true });
      throw fail(`timed out after ${timeoutMs}ms`);
    }
    throw fail(err instanceof Error ? err.message : "request failed");
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => "");
    const detail = raw.slice(0, DETAIL_LIMIT);
    throw fail(`HTTP ${response.status}: ${detail}`, {
      status: response.status,
      retryAfterMs: parseRetryAfter(response.headers.get("retry-after"), Date.now()),
      detail,
      ...parseErrorBody(raw),
    });
  }

  const payload = (await response.json().catch(() => null)) as {
    choices?: { message?: { content?: string } }[];
  } | null;
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) throw fail("returned an empty completion");
  return content;
}
