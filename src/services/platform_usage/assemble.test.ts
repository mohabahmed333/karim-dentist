import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { BYTES_PER_GB, BYTES_PER_MB } from "./quota.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { assemblePlatformUsageReport } from "./assemble.ts";

test("assembles five quota cards including Kapso messages", () => {
  const report = assemblePlatformUsageReport({
    storageUsedBytes: 100,
    databaseUsedBytes: 50 * BYTES_PER_MB,
    egressUsedBytes: null,
    authMauUsed: 12,
    kapsoMessagesUsed: 40,
  });
  assert.equal(report.plan, "free");
  assert.deepEqual(
    report.metrics.map((metric) => metric.id),
    ["storage", "database", "egress", "authMau", "kapsoMessages"],
  );
  const [storage, database, egress, auth, kapso] = report.metrics;
  assert.equal(storage?.status, "ok");
  assert.equal(database?.quota, 500 * BYTES_PER_MB);
  assert.equal(egress?.status, "unavailable");
  assert.equal(auth?.remaining, 50_000 - 12);
  assert.equal(storage?.quota, BYTES_PER_GB);
  assert.equal(kapso?.used, 40);
  assert.equal(kapso?.quota, 2_000);
  assert.equal(kapso?.remaining, 1_960);
});
