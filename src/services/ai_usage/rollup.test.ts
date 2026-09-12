import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { rollUpAiUsage } from "./rollup.ts";

const CHAIN = [
  { provider: "gemini" as const, model: "gemini-3.8-flash" },
  { provider: "mistral" as const, model: "mistral-large-latest" },
  { provider: "groq" as const, model: "openai/gpt-oss-120b" },
];

const row = (
  provider: string,
  model: string,
  over: Partial<{
    requests: number;
    promptTokens: number;
    completionTokens: number;
    rateLimitedCount: number;
    lastRateLimitedAt: string | null;
  }> = {},
) => ({
  provider,
  model,
  requests: over.requests ?? 0,
  promptTokens: over.promptTokens ?? 0,
  completionTokens: over.completionTokens ?? 0,
  rateLimitedCount: over.rateLimitedCount ?? 0,
  lastRateLimitedAt: over.lastRateLimitedAt ?? null,
});

const ids = (lines: { id: string }[]) => lines.map((line) => line.id);

describe("rollUpAiUsage", () => {
  /** The section reads like the chain itself, so the order has to match it. */
  it("lists every model in chain order, even the ones nothing used", () => {
    const { lines } = rollUpAiUsage({ chain: CHAIN, rows: [] });
    assert.deepEqual(ids(lines), [
      "gemini:gemini-3.8-flash",
      "mistral:mistral-large-latest",
      "groq:openai/gpt-oss-120b",
    ]);
    assert.equal(lines[0].requests, 0);
    assert.equal(lines[0].tokens, 0);
  });

  it("adds prompt and completion tokens into one number", () => {
    const { lines } = rollUpAiUsage({
      chain: CHAIN,
      rows: [row("groq", "openai/gpt-oss-120b", {
        requests: 12,
        promptTokens: 8_000,
        completionTokens: 2_000,
      })],
    });
    const groq = lines.find((l) => l.id === "groq:openai/gpt-oss-120b")!;
    assert.equal(groq.requests, 12);
    assert.equal(groq.tokens, 10_000);
  });

  /**
   * A model dropped from the chain can still have spent tokens today, and
   * hiding that would misreport the day's usage.
   */
  it("keeps a used model that is no longer in the chain, after the chain", () => {
    const { lines } = rollUpAiUsage({
      chain: CHAIN,
      rows: [row("groq", "retired-model", { requests: 3, promptTokens: 100 })],
    });
    assert.equal(lines.length, 4);
    assert.equal(lines[3].id, "groq:retired-model");
    assert.equal(lines[3].inChain, false);
    assert.equal(lines[0].inChain, true);
  });

  it("measures usage against a published daily cap", () => {
    const { lines } = rollUpAiUsage({
      chain: CHAIN,
      rows: [row("groq", "openai/gpt-oss-120b", {
        promptTokens: 40_000,
        completionTokens: 10_000,
      })],
    });
    const groq = lines.find((l) => l.id === "groq:openai/gpt-oss-120b")!;
    assert.equal(groq.capTokens, 200_000);
    assert.equal(groq.ratio, 0.25);
  });

  it("leaves the ratio null when the provider publishes no cap", () => {
    const { lines } = rollUpAiUsage({
      chain: CHAIN,
      rows: [row("gemini", "gemini-3.8-flash", { requests: 5, promptTokens: 900 })],
    });
    const gemini = lines.find((l) => l.id === "gemini:gemini-3.8-flash")!;
    assert.equal(gemini.capTokens, null);
    assert.equal(gemini.ratio, null);
    assert.equal(gemini.tokens, 900);
  });

  it("never reports more than a full cap", () => {
    const { lines } = rollUpAiUsage({
      chain: CHAIN,
      rows: [row("groq", "openai/gpt-oss-120b", { promptTokens: 500_000 })],
    });
    assert.equal(lines.find((l) => l.id === "groq:openai/gpt-oss-120b")!.ratio, 1);
  });

  /** "It ran out at 14:32" is the whole reason someone opens this section. */
  it("marks a model that hit its limit, and says when", () => {
    const at = "2026-09-12T14:32:00.000Z";
    const { lines } = rollUpAiUsage({
      chain: CHAIN,
      rows: [row("groq", "openai/gpt-oss-120b", {
        requests: 40,
        rateLimitedCount: 3,
        lastRateLimitedAt: at,
      })],
    });
    const groq = lines.find((l) => l.id === "groq:openai/gpt-oss-120b")!;
    assert.equal(groq.status, "rate_limited");
    assert.equal(groq.lastRateLimitedAt, at);
  });

  it("calls a model idle until something actually uses it", () => {
    const { lines } = rollUpAiUsage({ chain: CHAIN, rows: [] });
    assert.equal(lines[0].status, "idle");
  });

  it("calls a model that answered today active", () => {
    const { lines } = rollUpAiUsage({
      chain: CHAIN,
      rows: [row("gemini", "gemini-3.8-flash", { requests: 2, promptTokens: 10 })],
    });
    assert.equal(lines[0].status, "active");
  });

  it("totals the day across every model", () => {
    const { totals } = rollUpAiUsage({
      chain: CHAIN,
      rows: [
        row("gemini", "gemini-3.8-flash", { requests: 4, promptTokens: 1_000, completionTokens: 500 }),
        row("groq", "openai/gpt-oss-120b", { requests: 6, promptTokens: 2_000, completionTokens: 500 }),
      ],
    });
    assert.equal(totals.requests, 10);
    assert.equal(totals.tokens, 4_000);
  });
});
