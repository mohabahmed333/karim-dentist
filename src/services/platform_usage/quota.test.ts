import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { BYTES_PER_GB, BYTES_PER_MB, freePlanQuotas } from "./quota.ts";

test("maps the Supabase free plan to official usage quotas", () => {
  const quotas = freePlanQuotas();
  assert.equal(quotas.storageBytes, 1 * BYTES_PER_GB);
  assert.equal(quotas.databaseBytes, 500 * BYTES_PER_MB);
  assert.equal(quotas.egressBytes, 5 * BYTES_PER_GB);
  assert.equal(quotas.authMau, 50_000);
  assert.equal(quotas.kapsoMessages, 2_000);
});
