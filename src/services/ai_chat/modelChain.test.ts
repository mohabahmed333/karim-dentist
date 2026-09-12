import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { DEFAULT_CHAIN, parseModelChain, resolveChain } from "./modelChain.ts";

const ALL_KEYS = {
  GEMINI_API_KEY: "g",
  MISTRAL_API_KEY: "m",
  GROQ_API_KEY: "k",
};

const ids = (chain: { provider: string; model: string }[]) =>
  chain.map((entry) => `${entry.provider}:${entry.model}`);

describe("DEFAULT_CHAIN", () => {
  /**
   * The whole point of the feature: the strongest non-Groq models answer first,
   * and Groq — whose per-model daily cap is what we keep hitting — is the last
   * resort rather than the only one.
   */
  it("puts the other providers first and every Groq model last", () => {
    assert.deepEqual(ids(DEFAULT_CHAIN), [
      "gemini:gemini-3.8-flash",
      "mistral:mistral-large-latest",
      "gemini:gemini-2.5-flash",
      "mistral:mistral-saba-latest",
      "groq:openai/gpt-oss-120b",
      "groq:qwen/qwen3.8-27b",
      "groq:openai/gpt-oss-20b",
    ]);
    const firstGroq = DEFAULT_CHAIN.findIndex((e) => e.provider === "groq");
    const lastOther = DEFAULT_CHAIN.map((e) => e.provider).lastIndexOf("gemini");
    assert.ok(firstGroq > lastOther, "Groq must not outrank another provider");
  });

  it("lists no model twice", () => {
    assert.equal(new Set(ids(DEFAULT_CHAIN)).size, DEFAULT_CHAIN.length);
  });
});

describe("parseModelChain", () => {
  it("reads comma-separated provider:model pairs", () => {
    assert.deepEqual(parseModelChain("gemini:gemini-3.8-flash,groq:openai/gpt-oss-20b"), [
      { provider: "gemini", model: "gemini-3.8-flash" },
      { provider: "groq", model: "openai/gpt-oss-20b" },
    ]);
  });

  it("tolerates spacing, casing and trailing commas", () => {
    assert.deepEqual(parseModelChain(" GEMINI : gemini-3.8-flash , "), [
      { provider: "gemini", model: "gemini-3.8-flash" },
    ]);
  });

  /** A model id may contain slashes and dots, but never a colon. */
  it("splits on the first colon only", () => {
    assert.deepEqual(parseModelChain("groq:openai/gpt-oss-120b"), [
      { provider: "groq", model: "openai/gpt-oss-120b" },
    ]);
  });

  it("drops entries naming an unknown provider or no model", () => {
    assert.deepEqual(parseModelChain("openai:gpt-4,groq:,:x,gemini:gemini-2.5-flash"), [
      { provider: "gemini", model: "gemini-2.5-flash" },
    ]);
  });

  it("returns nothing for empty or missing input", () => {
    assert.deepEqual(parseModelChain(undefined), []);
    assert.deepEqual(parseModelChain("   "), []);
  });
});

describe("resolveChain", () => {
  it("uses the default chain when AI_MODEL_CHAIN is unset", () => {
    assert.deepEqual(ids(resolveChain(ALL_KEYS)), ids(DEFAULT_CHAIN));
  });

  it("lets AI_MODEL_CHAIN replace the order outright", () => {
    const chain = resolveChain({
      ...ALL_KEYS,
      AI_MODEL_CHAIN: "groq:openai/gpt-oss-20b,gemini:gemini-3.8-flash",
    });
    assert.deepEqual(ids(chain), ["groq:openai/gpt-oss-20b", "gemini:gemini-3.8-flash"]);
  });

  /**
   * Deploys that only ever had a Groq key must keep working untouched — the
   * entries we cannot authenticate are simply not in the chain.
   */
  it("drops entries whose provider key is missing", () => {
    const chain = resolveChain({ GROQ_API_KEY: "k" });
    assert.deepEqual(ids(chain), [
      "groq:openai/gpt-oss-120b",
      "groq:qwen/qwen3.8-27b",
      "groq:openai/gpt-oss-20b",
    ]);
  });

  it("is empty when no provider key is set at all", () => {
    assert.deepEqual(resolveChain({}), []);
  });

  /** GROQ_MODEL predates this chain and still names the Groq model we prefer. */
  it("honours GROQ_MODEL on the first Groq entry of the default chain", () => {
    const chain = resolveChain({ GROQ_API_KEY: "k", GROQ_MODEL: "llama-3.3-70b-versatile" });
    assert.deepEqual(ids(chain), [
      "groq:llama-3.3-70b-versatile",
      "groq:qwen/qwen3.8-27b",
      "groq:openai/gpt-oss-20b",
    ]);
  });

  it("keeps a GROQ_MODEL that duplicates a later entry from appearing twice", () => {
    const chain = resolveChain({ GROQ_API_KEY: "k", GROQ_MODEL: "openai/gpt-oss-20b" });
    assert.deepEqual(ids(chain), ["groq:openai/gpt-oss-20b", "groq:qwen/qwen3.8-27b"]);
  });

  it("ignores GROQ_MODEL when AI_MODEL_CHAIN spells the chain out", () => {
    const chain = resolveChain({
      GROQ_API_KEY: "k",
      GROQ_MODEL: "llama-3.3-70b-versatile",
      AI_MODEL_CHAIN: "groq:openai/gpt-oss-120b",
    });
    assert.deepEqual(ids(chain), ["groq:openai/gpt-oss-120b"]);
  });
});
