import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isRevertible, TRACKED_TABLES } from "./revertPolicy.ts";

describe("isRevertible", () => {
  it("allows a plain tracked table", () => {
    assert.equal(isRevertible("reservations"), true);
    assert.equal(isRevertible("patients"), true);
  });

  it("excludes messaging metadata even though it is tracked", () => {
    assert.equal(TRACKED_TABLES.includes("whatsapp_conversations"), true);
    assert.equal(isRevertible("whatsapp_conversations"), false);
    assert.equal(isRevertible("clinic_chat_threads"), false);
  });

  it("excludes role_permissions (composite key, no single row id)", () => {
    assert.equal(TRACKED_TABLES.includes("role_permissions"), true);
    assert.equal(isRevertible("role_permissions"), false);
  });

  it("rejects a table that isn't tracked at all", () => {
    assert.equal(isRevertible("hero"), false);
    assert.equal(isRevertible("services"), false);
  });
});
