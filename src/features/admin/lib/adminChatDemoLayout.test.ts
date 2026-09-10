import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { nextDockCollapsedOnLayoutToggle } from "./adminChatDemoLayout.ts";

describe("nextDockCollapsedOnLayoutToggle", () => {
  it("expands a leftover collapsed dock when switching to dock", () => {
    assert.equal(nextDockCollapsedOnLayoutToggle("dock", true), false);
    assert.equal(nextDockCollapsedOnLayoutToggle("dock", false), false);
  });

  it("keeps the collapsed flag when switching to float", () => {
    assert.equal(nextDockCollapsedOnLayoutToggle("float", true), true);
    assert.equal(nextDockCollapsedOnLayoutToggle("float", false), false);
  });
});
