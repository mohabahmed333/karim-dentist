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

const BASE_DEPS = {
  hasAccessToken: false,
  getStorageUsedBytes: async () => 0,
  fetchDatabaseSize: async () => null,
  fetchEgress: async () => null,
  fetchMau: async () => null,
  fetchApiCounts: async () => null,
  countAuthUsers: async () => null,
  countKapsoMessages: async () => null,
  hasVercelToken: false,
  fetchVercelUsage: async () => null,
};

test("rolls today's AI spend up in chain order", async () => {
  const data = await loadPlatformUsage({
    ...BASE_DEPS,
    getAiChain: () => [
      { provider: "gemini", model: "gemini-3.8-flash" },
      { provider: "groq", model: "openai/gpt-oss-120b" },
    ],
    fetchAiUsageToday: async () => [
      {
        provider: "groq",
        model: "openai/gpt-oss-120b",
        requests: 4,
        promptTokens: 1_000,
        completionTokens: 200,
        rateLimitedCount: 0,
        lastRateLimitedAt: null,
      },
    ],
  });
  assert.deepEqual(
    data.aiUsage?.lines.map((line: { id: string }) => line.id),
    ["gemini:gemini-3.8-flash", "groq:openai/gpt-oss-120b"],
  );
  assert.equal(data.aiUsage?.totals.requests, 4);
  assert.equal(data.aiUsage?.totals.tokens, 1_200);
});

/** "The table is not there yet" must not read as "nothing used the models". */
test("reports AI usage as unavailable when the rows cannot be read", async () => {
  const data = await loadPlatformUsage({
    ...BASE_DEPS,
    fetchAiUsageToday: async () => null,
  });
  assert.equal(data.aiUsage, null);
});
