import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildConsumptionTrendChart } from "./inventoryAnalyticsStats";
import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

describe("buildConsumptionTrendChart", () => {
  it("buckets cost into one point per day across the range, inclusive", () => {
    const from = new Date(2026, 8, 1, 0, 0, 0);
    const to = new Date(2026, 8, 3, 23, 59, 59);
    const rows: WeekConsumptionRow[] = [
      { date: new Date(2026, 8, 1, 10, 0, 0).toISOString(), cost: 100 },
      { date: new Date(2026, 8, 3, 9, 0, 0).toISOString(), cost: 40 },
      { date: new Date(2026, 8, 3, 15, 0, 0).toISOString(), cost: 10 },
    ];
    const chart = buildConsumptionTrendChart(rows, from, to);
    assert.equal(chart.length, 3);
    assert.equal(chart[0]!.amount, 100);
    assert.equal(chart[1]!.amount, 0);
    assert.equal(chart[2]!.amount, 50);
  });

  it("returns an all-zero range for no transactions", () => {
    const from = new Date(2026, 8, 1);
    const to = new Date(2026, 8, 2);
    assert.deepEqual(
      buildConsumptionTrendChart([], from, to).map((d) => d.amount),
      [0, 0],
    );
  });
});
