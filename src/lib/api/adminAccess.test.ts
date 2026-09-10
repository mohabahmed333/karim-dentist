import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isAdminProfile, resolveAdminAccess } from "./adminAccess.ts";

type FakeProfile = { role: string | null; deleted_at: string | null } | null;

/**
 * Minimal stand-in for the chained Supabase builder used by resolveAdminAccess:
 *   supabase.from("profiles").select(...).eq(...).maybeSingle()
 */
function fakeClient(opts: {
  user?: { id: string } | null;
  profile?: FakeProfile;
  profileError?: { message: string } | null;
}) {
  const calls: { table?: string; column?: string; value?: unknown } = {};
  return {
    calls,
    auth: {
      async getUser() {
        return { data: { user: opts.user ?? null }, error: null };
      },
    },
    from(table: string) {
      calls.table = table;
      return {
        select() {
          return {
            eq(column: string, value: unknown) {
              calls.column = column;
              calls.value = value;
              return {
                async maybeSingle() {
                  return {
                    data: opts.profile ?? null,
                    error: opts.profileError ?? null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

describe("isAdminProfile", () => {
  it("accepts an active admin", () => {
    assert.equal(isAdminProfile({ role: "admin", deleted_at: null }), true);
  });

  it("rejects a viewer", () => {
    assert.equal(isAdminProfile({ role: "viewer", deleted_at: null }), false);
  });

  it("rejects a soft-deleted admin", () => {
    assert.equal(
      isAdminProfile({ role: "admin", deleted_at: "2026-01-01T00:00:00Z" }),
      false,
    );
  });

  it("rejects a missing profile", () => {
    assert.equal(isAdminProfile(null), false);
    assert.equal(isAdminProfile(undefined), false);
  });

  it("rejects an unknown or null role", () => {
    assert.equal(isAdminProfile({ role: null, deleted_at: null }), false);
    assert.equal(isAdminProfile({ role: "owner", deleted_at: null }), false);
  });
});

describe("resolveAdminAccess", () => {
  it("returns isAdmin for an active admin profile", async () => {
    const client = fakeClient({
      user: { id: "u1" },
      profile: { role: "admin", deleted_at: null },
    });
    const result = await resolveAdminAccess(client);
    assert.equal(result.isAdmin, true);
    assert.equal(result.user?.id, "u1");
    assert.equal(client.calls.table, "profiles");
    assert.equal(client.calls.column, "id");
    assert.equal(client.calls.value, "u1");
  });

  /**
   * The regression this whole change exists for: before the fix, any
   * authenticated user passed requireAdmin() and could reach service-role
   * routes that bypass RLS (whatsapp send/read/status).
   */
  it("denies an authenticated non-admin", async () => {
    const result = await resolveAdminAccess(
      fakeClient({
        user: { id: "u2" },
        profile: { role: "viewer", deleted_at: null },
      }),
    );
    assert.equal(result.isAdmin, false);
    assert.equal(result.user?.id, "u2");
  });

  it("denies an authenticated user with no profile row", async () => {
    const result = await resolveAdminAccess(
      fakeClient({ user: { id: "u3" }, profile: null }),
    );
    assert.equal(result.isAdmin, false);
    assert.equal(result.user?.id, "u3");
  });

  it("returns no user when unauthenticated, without querying profiles", async () => {
    const client = fakeClient({ user: null });
    const result = await resolveAdminAccess(client);
    assert.equal(result.user, null);
    assert.equal(result.isAdmin, false);
    assert.equal(client.calls.table, undefined);
  });

  it("fails closed when the profile lookup errors", async () => {
    const result = await resolveAdminAccess(
      fakeClient({
        user: { id: "u4" },
        profile: null,
        profileError: { message: "boom" },
      }),
    );
    assert.equal(result.isAdmin, false);
  });
});
