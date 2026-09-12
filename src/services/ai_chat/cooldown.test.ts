import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { ProviderError } from "./callProvider.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { isCoolingDown, noteFailure, resetCooldowns } from "./cooldown.ts";

const ENTRY = { provider: "groq" as const, model: "openai/gpt-oss-120b" };
const OTHER = { provider: "gemini" as const, model: "gemini-3.8-flash" };
const NOW = 1_000_000;

const error = (
  init: { status?: number; retryAfterMs?: number | null; detail?: string } = {},
) =>
  new ProviderError("nope", {
    provider: ENTRY.provider,
    model: ENTRY.model,
    status: init.status ?? null,
    retryAfterMs: init.retryAfterMs ?? null,
    detail: init.detail ?? "",
  });

describe("cooldown", () => {
  beforeEach(() => resetCooldowns());

  it("cools nothing down until something fails", () => {
    assert.equal(isCoolingDown(ENTRY, NOW), false);
  });

  it("parks a rate-limited model for as long as retry-after says", () => {
    noteFailure(ENTRY, error({ status: 429, retryAfterMs: 120_000 }), NOW);
    assert.equal(isCoolingDown(ENTRY, NOW + 119_000), true);
    assert.equal(isCoolingDown(ENTRY, NOW + 121_000), false);
  });

  it("cools down only the model that failed", () => {
    noteFailure(ENTRY, error({ status: 429, retryAfterMs: 120_000 }), NOW);
    assert.equal(isCoolingDown(OTHER, NOW + 1), false);
  });

  /**
   * A per-minute limit clears itself quickly, so a long retry-after on one is
   * not worth believing — we would sit out capacity we already have.
   */
  it("caps an ordinary rate limit at five minutes", () => {
    noteFailure(ENTRY, error({ status: 429, retryAfterMs: 3_600_000 }), NOW);
    assert.equal(isCoolingDown(ENTRY, NOW + 299_000), true);
    assert.equal(isCoolingDown(ENTRY, NOW + 301_000), false);
  });

  /** The daily cap is the one that actually takes a model out for the day. */
  it("parks a per-day limit for an hour when no retry-after is given", () => {
    noteFailure(
      ENTRY,
      error({
        status: 429,
        detail: "Rate limit reached for model `openai/gpt-oss-120b` on tokens per day (TPD)",
      }),
      NOW,
    );
    assert.equal(isCoolingDown(ENTRY, NOW + 59 * 60_000), true);
    assert.equal(isCoolingDown(ENTRY, NOW + 61 * 60_000), false);
  });

  it("still believes a retry-after on a per-day limit, up to an hour", () => {
    noteFailure(
      ENTRY,
      error({ status: 429, retryAfterMs: 578_000, detail: "limit on requests per day (RPD)" }),
      NOW,
    );
    assert.equal(isCoolingDown(ENTRY, NOW + 577_000), true);
    assert.equal(isCoolingDown(ENTRY, NOW + 579_000), false);
  });

  it("falls back to a minute when a 429 says nothing useful", () => {
    noteFailure(ENTRY, error({ status: 429 }), NOW);
    assert.equal(isCoolingDown(ENTRY, NOW + 59_000), true);
    assert.equal(isCoolingDown(ENTRY, NOW + 61_000), false);
  });

  /** A rejected key stays rejected; asking every request is a waste of latency. */
  it("parks a model whose key is refused for half an hour", () => {
    for (const status of [401, 403]) {
      resetCooldowns();
      noteFailure(ENTRY, error({ status }), NOW);
      assert.equal(isCoolingDown(ENTRY, NOW + 29 * 60_000), true);
      assert.equal(isCoolingDown(ENTRY, NOW + 31 * 60_000), false);
    }
  });

  /**
   * An outage or a timeout is not evidence about quota. Skipping the model on
   * the next message would turn a blip into a self-inflicted outage.
   */
  it("does not cool down on a server error, timeout or bad request", () => {
    for (const status of [500, 502, 400, 404]) {
      noteFailure({ ...ENTRY, model: `m-${status}` }, error({ status }), NOW);
      assert.equal(isCoolingDown({ ...ENTRY, model: `m-${status}` }, NOW + 1), false);
    }
    noteFailure(ENTRY, error(), NOW);
    assert.equal(isCoolingDown(ENTRY, NOW + 1), false);
  });
});
