import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { VISION_CHAIN, resolveVisionChain, visionChainString } from "./visionChain.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseModelChain } from "./modelChain.ts";

const ALL_KEYS = {
  GEMINI_API_KEY: "g",
  MISTRAL_API_KEY: "m",
  GROQ_API_KEY: "q",
};

describe("resolveVisionChain", () => {
  it("returns the vision list when every key is set", () => {
    const chain = resolveVisionChain(ALL_KEYS);
    assert.deepEqual(chain, VISION_CHAIN);
  });

  it("drops entries whose provider key is missing", () => {
    const chain = resolveVisionChain({ GEMINI_API_KEY: "g" });
    assert.deepEqual(
      chain.map((e: { provider: string }) => e.provider),
      ["gemini", "gemini"],
    );
  });

  it("is empty when the only key belongs to a provider with no vision model", () => {
    // A deploy holding only GROQ_API_KEY has models but no eyes. The caller
    // must treat this as "send it to staff", not as an error.
    assert.deepEqual(resolveVisionChain({ GROQ_API_KEY: "q" }), []);
  });

  it("is empty when no key is set at all", () => {
    assert.deepEqual(resolveVisionChain({}), []);
  });

  it("honours AI_VISION_CHAIN as an explicit override", () => {
    const chain = resolveVisionChain({
      ...ALL_KEYS,
      AI_VISION_CHAIN: "gemini:gemini-3.6-flash",
    });
    assert.deepEqual(chain, [{ provider: "gemini", model: "gemini-3.6-flash" }]);
  });

  it("ignores AI_MODEL_CHAIN, so pinning the text chain cannot blind the reader", () => {
    const chain = resolveVisionChain({
      ...ALL_KEYS,
      AI_MODEL_CHAIN: "groq:openai/gpt-oss-20b",
    });
    assert.deepEqual(chain, VISION_CHAIN);
  });

  it("still filters an override by the keys that are actually set", () => {
    const chain = resolveVisionChain({
      GEMINI_API_KEY: "g",
      AI_VISION_CHAIN: "mistral:mistral-medium-latest,gemini:gemini-3.8-flash",
    });
    assert.deepEqual(chain, [{ provider: "gemini", model: "gemini-3.8-flash" }]);
  });

  it("drops a repeated entry, keeping the first", () => {
    const chain = resolveVisionChain({
      ...ALL_KEYS,
      AI_VISION_CHAIN: "gemini:gemini-3.8-flash,gemini:gemini-3.8-flash",
    });
    assert.equal(chain.length, 1);
  });
});

describe("visionChainString", () => {
  it("round-trips back through parseModelChain", () => {
    // This is the contract that makes the env-override trick work: whatever we
    // serialise here, resolveChain must read back as the same chain.
    const serialised = visionChainString(ALL_KEYS);
    assert.deepEqual(parseModelChain(serialised), VISION_CHAIN);
  });

  it("is empty when there is no vision model, rather than naming one", () => {
    assert.equal(visionChainString({ GROQ_API_KEY: "q" }), "");
  });
});
