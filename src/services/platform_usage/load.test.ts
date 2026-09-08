import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { loadPlatformUsage } from "./load.ts";

test("keeps storage when the Management API token is missing", async () => {
  const data = await loadPlatformUsage({
    hasAccessToken: false,
    getStorageUsedBytes: async () => 2048,
    fetchDatabaseSize: async () => 99,
    fetchEgress: async () => 1,
    fetchMau: async () => 9,
    fetchApiCounts: async () => ({
      auth: 1,
      rest: 2,
      storage: 3,
      realtime: 0,
      total: 6,
    }),
    countAuthUsers: async () => 7,
    countKapsoMessages: async () => 40,
    hasVercelToken: true,
    fetchVercelUsage: async () => ({
      fastDataTransferBytes: 11,
      edgeRequests: 22,
      functionInvocations: 33,
    }),
  });
  assert.equal(data.hasAccessToken, false);
  assert.equal(data.hasVercelToken, true);
  assert.equal(data.metrics.find((m) => m.id === "storage")?.used, 2048);
  assert.equal(data.metrics.find((m) => m.id === "database")?.status, "unavailable");
  assert.equal(data.metrics.find((m) => m.id === "egress")?.status, "unavailable");
  assert.equal(data.authSource, "users");
  assert.equal(data.metrics.find((m) => m.id === "authMau")?.used, 7);
  assert.equal(data.apiCounts, null);
  assert.equal(data.metrics.find((m) => m.id === "kapsoMessages")?.used, 40);
  assert.equal(data.metrics.find((m) => m.id === "vercelFastDataTransfer")?.used, 11);
  assert.equal(data.metrics.find((m) => m.id === "vercelEdgeRequests")?.used, 22);
  assert.equal(data.metrics.find((m) => m.id === "vercelFunctionInvocations")?.used, 33);
});

test("prefers analytics MAU over stored auth user count", async () => {
  const data = await loadPlatformUsage({
    hasAccessToken: true,
    getStorageUsedBytes: async () => 0,
    fetchDatabaseSize: async () => 10,
    fetchEgress: async () => null,
    fetchMau: async () => 42,
    fetchApiCounts: async () => null,
    countAuthUsers: async () => 100,
    countKapsoMessages: async () => null,
    hasVercelToken: false,
    fetchVercelUsage: async () => null,
  });
  assert.equal(data.authSource, "mau");
  assert.equal(data.hasVercelToken, false);
  assert.equal(data.metrics.find((m) => m.id === "authMau")?.used, 42);
  assert.equal(data.metrics.find((m) => m.id === "database")?.used, 10);
  assert.equal(data.metrics.find((m) => m.id === "kapsoMessages")?.status, "unavailable");
  assert.equal(
    data.metrics.find((m) => m.id === "vercelFastDataTransfer")?.status,
    "unavailable",
  );
});
