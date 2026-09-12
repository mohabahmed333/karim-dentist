import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { recordAiUsage } from "./record.ts";

type Call = { fn: string; args: Record<string, unknown> };

/** Stand-in for the service-role client, capturing what the RPC was asked. */
function fakeClient(result: { error?: unknown } = {}) {
  const calls: Call[] = [];
  return {
    calls,
    client: {
      rpc: async (fn: string, args: Record<string, unknown>) => {
        calls.push({ fn, args });
        return { error: result.error ?? null };
      },
    },
  };
}

describe("recordAiUsage", () => {
  it("adds one request and its tokens to today's row", async () => {
    const f = fakeClient();
    await recordAiUsage(
      {
        provider: "groq",
        model: "openai/gpt-oss-120b",
        usage: { promptTokens: 900, completionTokens: 100, totalTokens: 1000 },
      },
      { client: f.client },
    );
    assert.equal(f.calls.length, 1);
    assert.equal(f.calls[0].fn, "record_ai_usage");
    assert.deepEqual(f.calls[0].args, {
      p_provider: "groq",
      p_model: "openai/gpt-oss-120b",
      p_requests: 1,
      p_prompt_tokens: 900,
      p_completion_tokens: 100,
      p_rate_limited: 0,
    });
  });

  /** The call still happened and still counted against the model's RPD. */
  it("records the request even when the provider reported no tokens", async () => {
    const f = fakeClient();
    await recordAiUsage(
      { provider: "gemini", model: "gemini-3.8-flash", usage: null },
      { client: f.client },
    );
    assert.deepEqual(f.calls[0].args.p_requests, 1);
    assert.equal(f.calls[0].args.p_prompt_tokens, 0);
    assert.equal(f.calls[0].args.p_completion_tokens, 0);
  });

  /** A refusal is not a served request — it is the thing the page must show. */
  it("records a rate limit without counting it as a request", async () => {
    const f = fakeClient();
    await recordAiUsage(
      { provider: "groq", model: "openai/gpt-oss-120b", rateLimited: true },
      { client: f.client },
    );
    assert.equal(f.calls[0].args.p_rate_limited, 1);
    assert.equal(f.calls[0].args.p_requests, 0);
  });

  /**
   * Bookkeeping must never cost a patient their reply: the row is a nice-to-
   * have, the answer already went out.
   */
  it("stays silent when the database rejects the write", async () => {
    const f = fakeClient({ error: { message: "permission denied" } });
    await assert.doesNotReject(() =>
      recordAiUsage(
        { provider: "groq", model: "openai/gpt-oss-120b", usage: null },
        { client: f.client },
      ),
    );
  });

  it("stays silent when the rpc itself throws", async () => {
    await assert.doesNotReject(() =>
      recordAiUsage(
        { provider: "groq", model: "openai/gpt-oss-120b", usage: null },
        {
          client: {
            rpc: async () => {
              throw new Error("network down");
            },
          },
        },
      ),
    );
  });

  /** Local runs and tests have no service role key; that is not an error. */
  it("does nothing when no client is configured", async () => {
    await assert.doesNotReject(() =>
      recordAiUsage({ provider: "groq", model: "m", usage: null }, { client: null }),
    );
  });
});
