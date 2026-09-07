import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { BYTES_PER_GB } from "./quota.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildUsageMetric } from "./metric.ts";

test("builds a used-vs-remaining metric for free storage", () => {
  const used = 26996810;
  const metric = buildUsageMetric({
    id: "storage",
    used,
    quota: BYTES_PER_GB,
    unit: "bytes",
  });
  assert.equal(metric.status, "ok");
  assert.equal(metric.remaining, BYTES_PER_GB - used);
  assert.equal(metric.usedLabel, "26 MB");
  assert.equal(metric.quotaLabel, "1.0 GB");
  assert.equal(metric.percentLabel, "3%");
});

test("marks a metric unavailable when used is missing", () => {
  const metric = buildUsageMetric({
    id: "egress",
    used: null,
    quota: 5 * BYTES_PER_GB,
    unit: "bytes",
  });
  assert.equal(metric.status, "unavailable");
  assert.equal(metric.used, 0);
  assert.equal(metric.remaining, 5 * BYTES_PER_GB);
});

test("formats count metrics for Auth MAUs", () => {
  const metric = buildUsageMetric({
    id: "authMau",
    used: 1200,
    quota: 50_000,
    unit: "count",
  });
  assert.equal(metric.usedLabel, "1,200");
  assert.equal(metric.remainingLabel, "48,800");
  assert.equal(metric.quotaLabel, "50,000");
  assert.equal(metric.percentLabel, "2%");
});

test("formats Kapso message counts against the free monthly quota", () => {
  const metric = buildUsageMetric({
    id: "kapsoMessages",
    used: 40,
    quota: 2_000,
    unit: "count",
  });
  assert.equal(metric.usedLabel, "40");
  assert.equal(metric.quotaLabel, "2,000");
  assert.equal(metric.remainingLabel, "1,960");
});
