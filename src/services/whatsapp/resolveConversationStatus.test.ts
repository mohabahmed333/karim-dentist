import { describe, expect, it } from "vitest";
import { resolveConversationStatus } from "./resolveConversationStatus";

describe("resolveConversationStatus", () => {
  it("sets ended when Kapso requests ended", () => {
    expect(
      resolveConversationStatus({
        existing: "archived",
        requested: "ended",
      }),
    ).toBe("ended");
  });

  it("auto-unarchives on inbound unread bump", () => {
    expect(
      resolveConversationStatus({
        existing: "archived",
        bumpUnread: true,
      }),
    ).toBe("active");
  });

  it("preserves archived on non-inbound updates", () => {
    expect(
      resolveConversationStatus({
        existing: "archived",
        requested: "active",
        bumpUnread: false,
      }),
    ).toBe("archived");
  });

  it("defaults to active", () => {
    expect(resolveConversationStatus({})).toBe("active");
    expect(
      resolveConversationStatus({ existing: "ended", requested: "active" }),
    ).toBe("active");
  });
});
