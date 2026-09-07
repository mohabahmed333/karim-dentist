import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  parseApiCountTotals,
  parseDatabaseSizeBytes,
  parseNumericUsage,
} from "./parse.ts";

test("reads database size from a Management API query row", () => {
  assert.equal(
    parseDatabaseSizeBytes([{ pg_database_size: "123456789" }]),
    123456789,
  );
  assert.equal(parseDatabaseSizeBytes({ result: [] }), null);
});

test("sums usage.api-counts rows for the billing window", () => {
  const totals = parseApiCountTotals({
    result: [
      {
        total_auth_requests: 10,
        total_rest_requests: 20,
        total_storage_requests: 5,
        total_realtime_requests: 1,
      },
      {
        total_auth_requests: 2,
        total_rest_requests: 3,
        total_storage_requests: 0,
        total_realtime_requests: 0,
      },
    ],
  });
  assert.deepEqual(totals, {
    auth: 12,
    rest: 23,
    storage: 5,
    realtime: 1,
    total: 41,
  });
});

test("reads a numeric usage field and ignores missing egress", () => {
  assert.equal(parseNumericUsage({ result: [{ mau: 88 }] }, "mau"), 88);
  assert.equal(parseNumericUsage({ result: [] }, "egress_bytes"), null);
});
