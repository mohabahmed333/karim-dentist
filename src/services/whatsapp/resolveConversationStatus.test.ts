import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveConversationStatus } from "./resolveConversationStatus";

describe("resolveConversationStatus", () => {
  it("sets ended when Kapso requests ended", () => {
    assert.equal(resolveConversationStatus({
        existing: "archived",
        requested: "ended",
      }), "ended");
  });

  it("auto-unarchives on inbound unread bump", () => {
    assert.equal(resolveConversationStatus({
        existing: "archived",
        bumpUnread: true,
      }), "active");
  });

  it("preserves archived on non-inbound updates", () => {
    assert.equal(resolveConversationStatus({
        existing: "archived",
        requested: "active",
        bumpUnread: false,
      }), "archived");
  });

  it("defaults to active", () => {
    assert.equal(resolveConversationStatus({}), "active");
    assert.equal(resolveConversationStatus({ existing: "ended", requested: "active" }), "active");
  });
});
