import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildWeekConsumptionChart } from "./dashboardInventoryStats";
import type { WeekConsumptionRow } from "@/services/inventory/statsQueries";

describe("buildWeekConsumptionChart", () => {
  // 2026-09-15 is a Tuesday; the week is Mon 2026-09-14 .. Sun 2026-09-20.
  const now = new Date(2026, 8, 15, 12, 0, 0);

  it("buckets consumption cost into the 7 days of the week containing `now`", () => {
    const rows: WeekConsumptionRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), cost: 120 },
      { date: new Date(2026, 8, 15, 9, 0, 0).toISOString(), cost: 30 },
      { date: new Date(2026, 8, 15, 15, 0, 0).toISOString(), cost: 20 },
    ];
    const chart = buildWeekConsumptionChart(rows, now);
    assert.equal(chart.length, 7);
    assert.equal(chart[0]!.amount, 120);
    assert.equal(chart[1]!.amount, 50);
    assert.equal(chart[2]!.amount, 0);
  });

  it("returns an all-zero week for no transactions", () => {
    const chart = buildWeekConsumptionChart([], now);
    assert.deepEqual(chart.map((d) => d.amount), [0, 0, 0, 0, 0, 0, 0]);
  });
});
