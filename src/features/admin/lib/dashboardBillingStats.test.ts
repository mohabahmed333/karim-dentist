import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBillingWeekRevenue, buildPaymentMethodMix } from "./dashboardBillingStats";
import type { WeekPaymentRow } from "@/services/patient_billing/types";

describe("buildBillingWeekRevenue", () => {
  // 2026-09-15 is a Tuesday; the week is Mon 2026-09-14 .. Sun 2026-09-20.
  const now = new Date(2026, 8, 15, 12, 0, 0);

  it("buckets amounts into the 7 days of the week containing `now`", () => {
    const rows: WeekPaymentRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 100, method: "cash" },
      { date: new Date(2026, 8, 15, 9, 0, 0).toISOString(), amount: 50, method: "card" },
      { date: new Date(2026, 8, 15, 15, 0, 0).toISOString(), amount: 25, method: "cash" },
    ];
    const chart = buildBillingWeekRevenue(rows, now);
    assert.equal(chart.length, 7);
    assert.equal(chart[0]!.amount, 100);
    assert.equal(chart[1]!.amount, 75);
    assert.equal(chart[2]!.amount, 0);
  });

  it("returns an all-zero week for no payments", () => {
    const chart = buildBillingWeekRevenue([], now);
    assert.deepEqual(chart.map((d) => d.amount), [0, 0, 0, 0, 0, 0, 0]);
  });
});

describe("buildPaymentMethodMix", () => {
  it("buckets known methods and drops zero-amount ones, in fixed order", () => {
    const rows: WeekPaymentRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 100, method: "cash" },
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 300, method: "deposit" },
    ];
    const mix = buildPaymentMethodMix(rows);
    assert.deepEqual(mix, [
      { method: "cash", amount: 100, percent: 25 },
      { method: "deposit", amount: 300, percent: 75 },
    ]);
  });

  it("buckets a null or unrecognized method as other", () => {
    const rows: WeekPaymentRow[] = [
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 40, method: null },
      { date: new Date(2026, 8, 14, 10, 0, 0).toISOString(), amount: 10, method: "bank_transfer" },
    ];
    const mix = buildPaymentMethodMix(rows);
    assert.deepEqual(mix, [{ method: "other", amount: 50, percent: 100 }]);
  });

  it("returns an empty list for no payments", () => {
    assert.deepEqual(buildPaymentMethodMix([]), []);
  });
});
