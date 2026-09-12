import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { PROVIDERS, hasAnyAiKey, providerApiKey } from "./providers.ts";

describe("providers", () => {
  it("addresses every provider's OpenAI-compatible chat completions endpoint", () => {
    assert.equal(
      PROVIDERS.gemini.url,
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    );
    assert.equal(PROVIDERS.mistral.url, "https://api.mistral.ai/v1/chat/completions");
    assert.equal(PROVIDERS.groq.url, "https://api.groq.com/openai/v1/chat/completions");
  });

  it("reads each provider's key from its own env var", () => {
    const env = { GEMINI_API_KEY: "g", MISTRAL_API_KEY: "m" };
    assert.equal(providerApiKey("gemini", env), "g");
    assert.equal(providerApiKey("mistral", env), "m");
    assert.equal(providerApiKey("groq", env), "");
  });

  /** A key pasted with a trailing newline is the classic Vercel mistake. */
  it("trims surrounding whitespace off a key", () => {
    assert.equal(providerApiKey("groq", { GROQ_API_KEY: " k\n" }), "k");
  });

  it("treats a blank key as absent", () => {
    assert.equal(providerApiKey("groq", { GROQ_API_KEY: "   " }), "");
    assert.equal(hasAnyAiKey({ GROQ_API_KEY: "   " }), false);
  });

  it("reports whether any provider at all can be called", () => {
    assert.equal(hasAnyAiKey({}), false);
    assert.equal(hasAnyAiKey({ MISTRAL_API_KEY: "m" }), true);
    assert.equal(hasAnyAiKey({ GROQ_API_KEY: "k" }), true);
  });
});
