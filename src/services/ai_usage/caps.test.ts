import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { capFor } from "./caps.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { DEFAULT_CHAIN } from "../ai_chat/modelChain.ts";

describe("capFor", () => {
  /** The cap that actually bites: Groq stops a model at 200K tokens a day. */
  it("knows the published Groq daily caps", () => {
    const cap = capFor("groq", "openai/gpt-oss-120b");
    assert.equal(cap.tokensPerDay, 200_000);
    assert.equal(cap.requestsPerDay, 1_000);
    assert.equal(cap.tokensPerMonth, null);
  });

  it("treats Mistral's Experiment tier as a monthly token budget", () => {
    const cap = capFor("mistral", "mistral-large-latest");
    assert.equal(cap.tokensPerMonth, 1_000_000_000);
    assert.equal(cap.tokensPerDay, null);
  });

  /**
   * Google publishes free-tier limits in AI Studio rather than the docs, so we
   * have no number to show. Inventing one would be worse than showing none.
   */
  it("reports no published cap for Gemini", () => {
    const cap = capFor("gemini", "gemini-3.8-flash");
    assert.equal(cap.tokensPerDay, null);
    assert.equal(cap.requestsPerDay, null);
    assert.equal(cap.tokensPerMonth, null);
  });

  it("reports no cap for a model it has never heard of", () => {
    const cap = capFor("groq", "some-new-model");
    assert.equal(cap.tokensPerDay, null);
    assert.equal(cap.requestsPerDay, null);
  });

  it("answers for every model in the default chain", () => {
    for (const entry of DEFAULT_CHAIN) {
      assert.doesNotThrow(() => capFor(entry.provider, entry.model));
    }
  });
});
