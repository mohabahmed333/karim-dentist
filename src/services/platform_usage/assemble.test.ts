import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { BYTES_PER_GB, BYTES_PER_MB } from "./quota.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { assemblePlatformUsageReport } from "./assemble.ts";

test("assembles eight quota cards including Kapso and Vercel", () => {
  const report = assemblePlatformUsageReport({
    storageUsedBytes: 100,
    databaseUsedBytes: 50 * BYTES_PER_MB,
    egressUsedBytes: null,
    authMauUsed: 12,
    kapsoMessagesUsed: 40,
    vercelFastDataTransferBytes: 2 * BYTES_PER_GB,
    vercelEdgeRequests: 10,
    vercelFunctionInvocations: 3,
  });
  assert.equal(report.plan, "free");
  assert.deepEqual(
    report.metrics.map((metric) => metric.id),
    [
      "storage",
      "database",
      "egress",
      "authMau",
      "kapsoMessages",
      "vercelFastDataTransfer",
      "vercelEdgeRequests",
      "vercelFunctionInvocations",
    ],
  );
  const [storage, database, egress, auth, kapso, transfer, edge, invocations] =
    report.metrics;
  assert.equal(storage?.status, "ok");
  assert.equal(database?.quota, 500 * BYTES_PER_MB);
  assert.equal(egress?.status, "unavailable");
  assert.equal(auth?.remaining, 50_000 - 12);
  assert.equal(storage?.quota, BYTES_PER_GB);
  assert.equal(kapso?.used, 40);
  assert.equal(kapso?.quota, 2_000);
  assert.equal(kapso?.remaining, 1_960);
  assert.equal(transfer?.used, 2 * BYTES_PER_GB);
  assert.equal(transfer?.quota, 100 * BYTES_PER_GB);
  assert.equal(edge?.used, 10);
  assert.equal(edge?.quota, 1_000_000);
  assert.equal(invocations?.used, 3);
  assert.equal(invocations?.remaining, 999_997);
});
