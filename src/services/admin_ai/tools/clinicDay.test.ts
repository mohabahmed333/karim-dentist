import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { cairoDayRangeUtc } from "./clinicDay.ts";

describe("cairoDayRangeUtc", () => {
  it("bounds a summer (UTC+3) day at the right UTC instants", () => {
    // Egypt observes summer time from late April; 15 Sep is deep summer.
    const { startUtc, endUtc } = cairoDayRangeUtc("2026-09-15");
    assert.equal(startUtc, "2026-09-14T21:00:00.000Z");
    assert.equal(endUtc, "2026-09-15T21:00:00.000Z");
  });

  it("bounds a winter (UTC+2) day differently — no hardcoded offset", () => {
    const { startUtc, endUtc } = cairoDayRangeUtc("2026-01-15");
    assert.equal(startUtc, "2026-01-14T22:00:00.000Z");
    assert.equal(endUtc, "2026-01-15T22:00:00.000Z");
  });

  it("spans exactly 24 hours", () => {
    const { startUtc, endUtc } = cairoDayRangeUtc("2026-09-15");
    assert.equal(new Date(endUtc).getTime() - new Date(startUtc).getTime(), 24 * 60 * 60 * 1000);
  });
});
