import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { GroqError, groqChat } from "./callGroq.ts";

function jsonResponse(content: string, status = 200) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content } }] }),
    { status, headers: { "content-type": "application/json" } },
  );
}

const base = { apiKey: "k", messages: [{ role: "user" as const, content: "hi" }] };

describe("groqChat", () => {
  it("posts to Groq with auth, model and messages, returning the content", async () => {
    let seen: { url: string; init: RequestInit } | null = null;
    const out = await groqChat({
      ...base,
      fetchImpl: async (url: string, init: RequestInit) => {
        seen = { url, init };
        return jsonResponse("hello");
      },
    });
    assert.equal(out, "hello");
    assert.match(seen!.url, /api\.groq\.com/);
    const headers = seen!.init.headers as Record<string, string>;
    assert.equal(headers.Authorization, "Bearer k");
    const body = JSON.parse(seen!.init.body as string);
    assert.equal(body.model, "openai/gpt-oss-120b");
    assert.deepEqual(body.messages, base.messages);
  });

  it("passes through temperature, responseFormat and maxTokens", async () => {
    let body: Record<string, unknown> = {};
    await groqChat({
      ...base,
      temperature: 0,
      responseFormat: "json_object",
      maxTokens: 512,
      fetchImpl: async (_u: string, init: RequestInit) => {
        body = JSON.parse(init.body as string);
        return jsonResponse("{}");
      },
    });
    assert.equal(body.temperature, 0);
    assert.deepEqual(body.response_format, { type: "json_object" });
    assert.equal(body.max_tokens, 512);
  });

  it("retries a 429 and succeeds", async () => {
    let calls = 0;
    const out = await groqChat({
      ...base,
      retryDelayMs: 0,
      fetchImpl: async () => {
        calls += 1;
        return calls === 1 ? jsonResponse("", 429) : jsonResponse("ok");
      },
    });
    assert.equal(out, "ok");
    assert.equal(calls, 2);
  });

  it("retries a 500 up to the attempt limit, then throws GroqError", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        groqChat({
          ...base,
          attempts: 3,
          retryDelayMs: 0,
          fetchImpl: async () => {
            calls += 1;
            return jsonResponse("boom", 500);
          },
        }),
      (err: unknown) => err instanceof GroqError && err.status === 500,
    );
    assert.equal(calls, 3);
  });

  /** A 400 is our bug, not a blip — retrying just burns the request budget. */
  it("does not retry a 4xx other than 429", async () => {
    let calls = 0;
    await assert.rejects(
      () =>
        groqChat({
          ...base,
          retryDelayMs: 0,
          fetchImpl: async () => {
            calls += 1;
            return jsonResponse("bad", 400);
          },
        }),
      (err: unknown) => err instanceof GroqError && err.status === 400,
    );
    assert.equal(calls, 1);
  });

  it("throws GroqError when the response carries no content", async () => {
    await assert.rejects(
      () =>
        groqChat({
          ...base,
          fetchImpl: async () =>
            new Response("{}", { status: 200 }),
        }),
      /empty/i,
    );
  });

  it("aborts on timeout and reports it as a GroqError", async () => {
    await assert.rejects(
      () =>
        groqChat({
          ...base,
          timeoutMs: 5,
          attempts: 1,
          retryDelayMs: 0,
          fetchImpl: (_u: string, init: RequestInit) =>
            new Promise((_resolve, reject) => {
              init.signal?.addEventListener("abort", () =>
                reject(new DOMException("aborted", "AbortError")),
              );
            }),
        }),
      (err: unknown) => err instanceof GroqError && /timed out/i.test((err as Error).message),
    );
  });

  it("requires an api key", async () => {
    await assert.rejects(
      () => groqChat({ ...base, apiKey: "  " }),
      /GROQ_API_KEY/,
    );
  });
});

describe("groqChat — rejected JSON", () => {
  /**
   * Production saw `400 json_validate_failed` with the model's output cut to 200
   * characters, so neither the cause nor any usable answer survived.
   */
  it("exposes Groq's code and the model's full output when JSON validation fails", async () => {
    const generation = "العيادة مفتوحة من الأحد إلى الخميس من ١٠ الصبح لحد ٦ المسا";
    const body = JSON.stringify({
      error: {
        message: "Failed to generate JSON. Please adjust your prompt.",
        type: "invalid_request_error",
        code: "json_validate_failed",
        failed_generation: generation,
      },
    });
    await assert.rejects(
      () =>
        groqChat({
          apiKey: "k",
          messages: [{ role: "user", content: "hi" }],
          attempts: 1,
          retryDelayMs: 0,
          fetchImpl: async () => new Response(body, { status: 400 }),
        }),
      (err: unknown) =>
        err instanceof GroqError &&
        err.status === 400 &&
        err.code === "json_validate_failed" &&
        err.failedGeneration === generation,
    );
  });

  it("leaves code and output null for an unstructured error body", async () => {
    await assert.rejects(
      () =>
        groqChat({
          apiKey: "k",
          messages: [{ role: "user", content: "hi" }],
          attempts: 1,
          retryDelayMs: 0,
          fetchImpl: async () => new Response("boom", { status: 500 }),
        }),
      (err: unknown) =>
        err instanceof GroqError && err.code === null && err.failedGeneration === null,
    );
  });
});
