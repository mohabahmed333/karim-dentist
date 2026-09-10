import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  formatUnreadBadge,
  parseUnreadCount,
  resetInboundChimeSeen,
  takeInboundChime,
  unreadTotalFromConversations,
  type InboundChimeInput,
} from "./whatsappInboundAlert.ts";

afterEach(() => {
  resetInboundChimeSeen();
});

function input(
  patch: Partial<InboundChimeInput> = {},
): InboundChimeInput {
  return {
    eventType: "INSERT",
    direction: "inbound",
    conversationId: "c1",
    messageId: "m1",
    selectedConversationId: "c2",
    threadVisible: false,
    ...patch,
  };
}

describe("whatsappInboundAlert", () => {
  it("plays once for a new inbound insert while the thread is not on screen", () => {
    assert.equal(takeInboundChime(input()), true);
    assert.equal(takeInboundChime(input()), false);
  });

  it("does not play for outbound, updates, or deletes", () => {
    assert.equal(takeInboundChime(input({ direction: "outbound" })), false);
    assert.equal(
      takeInboundChime(input({ eventType: "UPDATE", messageId: "m2" })),
      false,
    );
    assert.equal(
      takeInboundChime(input({ eventType: "DELETE", messageId: "m3" })),
      false,
    );
  });

  it("does not play when that conversation thread is already visible", () => {
    assert.equal(
      takeInboundChime(
        input({
          selectedConversationId: "c1",
          threadVisible: true,
        }),
      ),
      false,
    );
  });

  it("still plays for the selected conversation if the panel is closed", () => {
    assert.equal(
      takeInboundChime(
        input({
          selectedConversationId: "c1",
          threadVisible: false,
        }),
      ),
      true,
    );
  });

  it("sums and formats unread badges", () => {
    assert.equal(parseUnreadCount("18"), 18);
    assert.equal(parseUnreadCount("99+"), 99);
    assert.equal(parseUnreadCount(undefined), 0);
    assert.equal(
      unreadTotalFromConversations([
        { unread: "2" },
        { unread: undefined },
        { unread: "4" },
      ]),
      6,
    );
    assert.equal(formatUnreadBadge(0), null);
    assert.equal(formatUnreadBadge(3), "3");
    assert.equal(formatUnreadBadge(120), "99+");
  });
});
