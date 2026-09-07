import assert from "node:assert/strict";
import test from "node:test";
import { ADMIN_LOGIN_PATH, signOutAdminSession } from "./signOutAdmin.ts";

test("admin login path is /admin/login", () => {
  assert.equal(ADMIN_LOGIN_PATH, "/admin/login");
});

test("signOutAdminSession succeeds when auth has no error", async () => {
  const result = await signOutAdminSession(async () => ({ error: null }));
  assert.deepEqual(result, { ok: true });
});

test("signOutAdminSession returns the auth error message", async () => {
  const result = await signOutAdminSession(async () => ({
    error: { message: "session expired" },
  }));
  assert.deepEqual(result, { ok: false, message: "session expired" });
});
