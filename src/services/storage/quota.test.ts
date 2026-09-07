import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  BYTES_PER_GB,
  formatStorageBytes,
  remainingStorageBytes,
  resolveStorageQuotaBytes,
  storageUsageRatio,
} from "./quota.ts";

test("maps Supabase plans to official file-storage quotas", () => {
  assert.equal(resolveStorageQuotaBytes({ plan: "free" }).quotaBytes, BYTES_PER_GB);
  assert.equal(
    resolveStorageQuotaBytes({ plan: "pro" }).quotaBytes,
    100 * BYTES_PER_GB,
  );
  assert.equal(resolveStorageQuotaBytes({ plan: "unknown" }).plan, "free");
});

test("honors an explicit quota override for custom enterprise limits", () => {
  assert.equal(
    resolveStorageQuotaBytes({ plan: "enterprise", overrideBytes: 500 * BYTES_PER_GB })
      .quotaBytes,
    500 * BYTES_PER_GB,
  );
});

test("computes remaining bytes and usage ratio for the overview card", () => {
  const used = 26996810;
  const quota = BYTES_PER_GB;
  assert.equal(remainingStorageBytes(used, quota), quota - used);
  assert.ok(storageUsageRatio(used, quota) > 0);
  assert.equal(storageUsageRatio(quota, quota), 1);
  assert.equal(storageUsageRatio(0, quota), 0);
});

test("formats storage sizes for the dashboard", () => {
  assert.equal(formatStorageBytes(512), "512 B");
  assert.equal(formatStorageBytes(1536), "1.5 KB");
  assert.equal(formatStorageBytes(26996810), "26 MB");
  assert.equal(formatStorageBytes(BYTES_PER_GB), "1.0 GB");
});
