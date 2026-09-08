import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { BYTES_PER_GB } from "./quota.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseVercelProjectUsage, vercelConfig } from "./vercel.ts";

const PROJECT = "prj_this";

function charge(overrides: Record<string, unknown>): string {
  return JSON.stringify({
    ChargeCategory: "Usage",
    ServiceName: "Fast Data Transfer",
    ConsumedQuantity: 1,
    ConsumedUnit: "GB",
    Tags: { ProjectId: PROJECT },
    ...overrides,
  });
}

test("sums this project's Fast Data Transfer, Edge Requests, and Function Invocations", () => {
  const jsonl = [
    charge({ ConsumedQuantity: 2.5, ConsumedUnit: "GB" }),
    charge({
      ServiceName: "Edge Requests",
      ConsumedQuantity: 120,
      ConsumedUnit: "Requests",
    }),
    charge({
      ServiceName: "Function Invocations",
      ConsumedQuantity: 9,
      ConsumedUnit: "Invocations",
    }),
    charge({
      ServiceName: "Outgoing Fast Data Transfer",
      ConsumedQuantity: 0.5,
      ConsumedUnit: "GB",
    }),
  ].join("\n");
  assert.deepEqual(parseVercelProjectUsage(jsonl, PROJECT), {
    fastDataTransferBytes: 3 * BYTES_PER_GB,
    edgeRequests: 120,
    functionInvocations: 9,
  });
});

test("ignores other projects and unattributed charges", () => {
  const jsonl = [
    charge({ ConsumedQuantity: 1, ConsumedUnit: "GB" }),
    charge({
      ConsumedQuantity: 80,
      ConsumedUnit: "GB",
      Tags: { ProjectId: "prj_other" },
    }),
    charge({
      ServiceName: "CDN Requests",
      ConsumedQuantity: 4,
      ConsumedUnit: "Requests",
      Tags: { ProjectId: PROJECT },
    }),
    charge({
      ServiceName: "Edge Requests",
      ConsumedQuantity: 99,
      ConsumedUnit: "Requests",
      Tags: {},
    }),
  ].join("\n");
  assert.deepEqual(parseVercelProjectUsage(jsonl, PROJECT), {
    fastDataTransferBytes: BYTES_PER_GB,
    edgeRequests: 4,
    functionInvocations: 0,
  });
});

test("treats an empty billing response as zero usage, not unavailable", () => {
  assert.deepEqual(parseVercelProjectUsage("", PROJECT), {
    fastDataTransferBytes: 0,
    edgeRequests: 0,
    functionInvocations: 0,
  });
});

test("returns null when the billing payload is not JSONL", () => {
  assert.equal(parseVercelProjectUsage("<html>nope</html>", PROJECT), null);
});

test("does not count Edge Request CPU duration as request volume", () => {
  const jsonl = charge({
    ServiceName: "Edge Requests - Additional CPU Duration",
    ConsumedQuantity: 12,
    ConsumedUnit: "Hours",
  });
  assert.deepEqual(parseVercelProjectUsage(jsonl, PROJECT), {
    fastDataTransferBytes: 0,
    edgeRequests: 0,
    functionInvocations: 0,
  });
});

test("requires a Vercel token, team id, and project id", () => {
  const keys = [
    "VERCEL_TOKEN",
    "VERCEL_ACCESS_TOKEN",
    "VERCEL_ORG_ID",
    "VERCEL_PROJECT_ID",
  ] as const;
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  try {
    for (const key of keys) delete process.env[key];
    assert.equal(vercelConfig(), null);
    process.env.VERCEL_ACCESS_TOKEN = "pat";
    process.env.VERCEL_ORG_ID = "team_1";
    process.env.VERCEL_PROJECT_ID = "prj_1";
    assert.deepEqual(vercelConfig(), {
      token: "pat",
      teamId: "team_1",
      projectId: "prj_1",
    });
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
