import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { ProviderError, callProvider } from "./callProvider.ts";

function jsonResponse(content: string, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

const base = {
  provider: "groq" as const,
  model: "openai/gpt-oss-120b",
  apiKey: "k",
  messages: [{ role: "user" as const, content: "hi" }],
};

type Seen = { url: string; init: RequestInit };

/** Capture the request a call makes, answering with `content`. */
function spy(content = "ok", status = 200, headers?: Record<string, string>) {
  const seen: Seen[] = [];
  const fetchImpl = async (url: string, init: RequestInit) => {
    seen.push({ url, init });
    return jsonResponse(content, status, headers);
  };
  const body = () => JSON.parse(seen[0].init.body as string) as Record<string, unknown>;
  const headersOf = () => seen[0].init.headers as Record<string, string>;
  return { seen, fetchImpl, body, headersOf };
}

describe("callProvider — the request", () => {
  it("posts to the provider's own endpoint with a bearer key", async () => {
    const s = spy("hello");
    const out = await callProvider({ ...base, fetchImpl: s.fetchImpl });
    assert.equal(out, "hello");
    assert.equal(s.seen[0].url, "https://api.groq.com/openai/v1/chat/completions");
    assert.equal(s.headersOf().Authorization, "Bearer k");
    assert.equal(s.body().model, "openai/gpt-oss-120b");
    assert.deepEqual(s.body().messages, base.messages);
  });

  it("sends each provider to its own URL", async () => {
    for (const [provider, url] of [
      ["gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"],
      ["mistral", "https://api.mistral.ai/v1/chat/completions"],
      ["cerebras", "https://api.cerebras.ai/v1/chat/completions"],
    ] as const) {
      const s = spy();
      await callProvider({ ...base, provider, model: "m", fetchImpl: s.fetchImpl });
      assert.equal(s.seen[0].url, url);
    }
  });

  it("passes through temperature, responseFormat and maxTokens", async () => {
    const s = spy("{}");
    await callProvider({
      ...base,
      temperature: 0,
      responseFormat: "json_object",
      maxTokens: 512,
      fetchImpl: s.fetchImpl,
    });
    assert.equal(s.body().temperature, 0);
    assert.deepEqual(s.body().response_format, { type: "json_object" });
    assert.equal(s.body().max_tokens, 512);
  });

  /** Cerebras rejects a request carrying both token caps. */
  it("never sends Cerebras both max_tokens and max_completion_tokens", async () => {
    const s = spy();
    await callProvider({
      ...base,
      provider: "cerebras",
      model: "gpt-oss-120b",
      maxTokens: 700,
      fetchImpl: s.fetchImpl,
    });
    assert.equal(s.body().max_tokens, 700);
    assert.equal("max_completion_tokens" in s.body(), false);
  });

  it("omits optional fields the caller did not set", async () => {
    const s = spy();
    await callProvider({ ...base, fetchImpl: s.fetchImpl });
    const sent = s.body();
    assert.equal("temperature" in sent, false);
    assert.equal("response_format" in sent, false);
    assert.equal("max_tokens" in sent, false);
  });

  it("requires an api key", async () => {
    await assert.rejects(
      () => callProvider({ ...base, apiKey: "  " }),
      (err: unknown) => err instanceof ProviderError && /GROQ_API_KEY/.test((err as Error).message),
    );
  });
});

describe("callProvider — failures", () => {
  it("reports the status and the body on a non-2xx, naming the model", async () => {
    await assert.rejects(
      () => callProvider({ ...base, fetchImpl: async () => jsonResponse("boom", 500) }),
      (err: unknown) => {
        assert.ok(err instanceof ProviderError);
        const e = err as ProviderError;
        assert.equal(e.status, 500);
        assert.equal(e.provider, "groq");
        assert.equal(e.model, "openai/gpt-oss-120b");
        assert.match(e.message, /groq:openai\/gpt-oss-120b/);
        return true;
      },
    );
  });

  /** The chain uses this to park an exhausted model instead of re-trying it. */
  it("carries retry-after and the body text off a 429", async () => {
    await assert.rejects(
      () =>
        callProvider({
          ...base,
          fetchImpl: async () =>
            new Response(
              JSON.stringify({
                error: {
                  message:
                    "Rate limit reached for model `openai/gpt-oss-120b` on tokens per day (TPD): Limit 200000",
                  code: "rate_limit_exceeded",
                },
              }),
              { status: 429, headers: { "retry-after": "120" } },
            ),
        }),
      (err: unknown) => {
        const e = err as ProviderError;
        assert.equal(e.status, 429);
        assert.equal(e.retryAfterMs, 120_000);
        assert.match(e.detail, /tokens per day/);
        return true;
      },
    );
  });

  it("leaves retryAfterMs null when the header is absent or unreadable", async () => {
    await assert.rejects(
      () => callProvider({ ...base, fetchImpl: async () => jsonResponse("no", 429) }),
      (err: unknown) => (err as ProviderError).retryAfterMs === null,
    );
  });

  it("treats an empty completion as a failure", async () => {
    await assert.rejects(
      () => callProvider({ ...base, fetchImpl: async () => new Response("{}", { status: 200 }) }),
      /empty/i,
    );
  });

  it("aborts on its own timeout and says so", async () => {
    await assert.rejects(
      () =>
        callProvider({
          ...base,
          timeoutMs: 5,
          fetchImpl: (_u: string, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener("abort", () =>
                reject(new DOMException("aborted", "AbortError")),
              );
            }),
        }),
      (err: unknown) => {
        const e = err as ProviderError;
        assert.match(e.message, /timed out/i);
        assert.equal(e.cancelled, false);
        return true;
      },
    );
  });

  /** The caller giving up must stop the chain, not advance it. */
  it("marks an abort from the caller's own signal as cancelled", async () => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(
      () =>
        callProvider({
          ...base,
          signal: controller.signal,
          fetchImpl: (_u: string, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener("abort", () =>
                reject(new DOMException("aborted", "AbortError")),
              );
            }),
        }),
      (err: unknown) => (err as ProviderError).cancelled === true,
    );
  });

  it("wraps a network error rather than leaking it", async () => {
    await assert.rejects(
      () =>
        callProvider({
          ...base,
          fetchImpl: async () => {
            throw new TypeError("fetch failed");
          },
        }),
      (err: unknown) => err instanceof ProviderError && (err as ProviderError).status === null,
    );
  });
});

describe("callProvider — Arabic", () => {
  /**
   * Patients write Egyptian Arabic, so a mangled encoding on any one provider
   * would be a reply the patient cannot read.
   */
  it("sends and returns Arabic unchanged", async () => {
    const reply = "إحنا مفتوحين من ١٠ صباحاً لـ ٦ مساءً.";
    const s = spy(reply);
    const out = await callProvider({
      ...base,
      messages: [{ role: "user", content: "عايز احجز موعد تنظيف" }],
      fetchImpl: s.fetchImpl,
    });
    assert.equal(out, reply);
    assert.deepEqual(s.body().messages, [{ role: "user", content: "عايز احجز موعد تنظيف" }]);
  });
});

describe("callProvider — a completion the provider rejected", () => {
  /**
   * The reason this is kept whole: `detail` is truncated for logs, and the
   * failed generation is routinely longer than that. It is both the evidence
   * of why a reply failed and, often, a usable answer.
   */
  it("carries the error code and the entire failed generation", async () => {
    const generation = `{"reply":"${"a long answer ".repeat(40)}"}`;
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          error: { code: "json_validate_failed", failed_generation: generation },
        }),
        { status: 400 },
      );
    await assert.rejects(
      () => callProvider({ ...base, responseFormat: "json_object", fetchImpl }),
      (err: unknown) =>
        err instanceof ProviderError &&
        err.code === "json_validate_failed" &&
        err.failedGeneration === generation &&
        err.detail.length < generation.length,
    );
  });

  it("leaves both null when the body is not JSON we recognise", async () => {
    const fetchImpl = async () => new Response("upstream exploded", { status: 502 });
    await assert.rejects(
      () => callProvider({ ...base, fetchImpl }),
      (err: unknown) =>
        err instanceof ProviderError &&
        err.code === null &&
        err.failedGeneration === null,
    );
  });
});
