import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractFlowFromKapso } from "./messageMedia.ts";

describe("extractFlowFromKapso button and list taps", () => {
  it("captures a reply-button tap: id, title and kind", () => {
    const flow = extractFlowFromKapso({
      type: "interactive",
      interactive: { type: "button_reply", button_reply: { id: "qr_visit_1", title: "Confirm" } },
    });
    assert.deepEqual(flow, { kind: "button_reply", title: "Confirm", buttonId: "qr_visit_1", replyKind: "button" });
  });

  it("captures a list-item tap the same way, with replyKind list", () => {
    const flow = extractFlowFromKapso({
      type: "interactive",
      interactive: { type: "list_reply", list_reply: { id: "row-3", title: "Cleaning" } },
    });
    assert.deepEqual(flow, { kind: "button_reply", title: "Cleaning", buttonId: "row-3", replyKind: "list" });
  });

  it("returns null when the title is missing or blank", () => {
    assert.equal(
      extractFlowFromKapso({
        type: "interactive",
        interactive: { type: "button_reply", button_reply: { id: "btn_1", title: "  " } },
      }),
      null,
    );
    assert.equal(
      extractFlowFromKapso({
        type: "interactive",
        interactive: { type: "button_reply", button_reply: { id: "btn_1" } },
      }),
      null,
    );
  });

  it("returns null when the id is missing", () => {
    assert.equal(
      extractFlowFromKapso({
        type: "interactive",
        interactive: { type: "button_reply", button_reply: { title: "Confirm" } },
      }),
      null,
    );
  });
});

describe("extractFlowFromKapso unrelated cases still work", () => {
  it("still reads a location message", () => {
    const flow = extractFlowFromKapso({
      type: "location",
      location: { latitude: "30.0074", longitude: "31.4913", name: "Clinic", address: "New Cairo" },
    });
    assert.deepEqual(flow, {
      kind: "location",
      title: "Clinic",
      address: "New Cairo",
      latitude: 30.0074,
      longitude: 31.4913,
    });
  });

  it("still returns null for plain text", () => {
    assert.equal(extractFlowFromKapso({ type: "text", text: { body: "hi" } }), null);
  });
});
