import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rangeDays, resolveInventoryAnalyticsRange } from "./inventoryAnalyticsFilters";

describe("rangeDays", () => {
  it("maps the two presets to their day counts", () => {
    assert.equal(rangeDays("30d"), 30);
    assert.equal(rangeDays("90d"), 90);
  });
});

describe("resolveInventoryAnalyticsRange", () => {
  it("resolves 30d to a 30-day window ending today", () => {
    const now = new Date(2026, 8, 15, 14, 0, 0);
    const { from, to } = resolveInventoryAnalyticsRange("30d", now);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    assert.equal(fromDate.getDate(), 17); // Aug 17 — 30 days before Sep 15 inclusive
    assert.equal(fromDate.getMonth(), 7);
    assert.equal(toDate.getDate(), 15);
    assert.equal(toDate.getMonth(), 8);
  });
});
