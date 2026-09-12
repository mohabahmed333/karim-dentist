import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseFlow } from "./supportWhatsappMap.ts";

describe("parseFlow button taps", () => {
  it("passes buttonId and replyKind through for a button_reply flow", () => {
    const flow = parseFlow({ kind: "button_reply", title: "Confirm", buttonId: "qr_visit_1", replyKind: "button" });
    assert.equal(flow?.kind, "button_reply");
    assert.equal(flow?.title, "Confirm");
    assert.equal(flow?.buttonId, "qr_visit_1");
    assert.equal(flow?.replyKind, "button");
  });

  it("passes them through for a list tap too", () => {
    const flow = parseFlow({ kind: "button_reply", title: "Cleaning", buttonId: "row-3", replyKind: "list" });
    assert.equal(flow?.replyKind, "list");
    assert.equal(flow?.buttonId, "row-3");
  });

  it("omits buttonId and replyKind when they are absent", () => {
    const flow = parseFlow({ kind: "location", title: "Clinic" });
    assert.equal(flow?.buttonId, undefined);
    assert.equal(flow?.replyKind, undefined);
  });

  it("omits them when they are the wrong type", () => {
    const flow = parseFlow({ kind: "button_reply", title: "Confirm", buttonId: 5, replyKind: "phone" });
    assert.equal(flow?.buttonId, undefined);
    assert.equal(flow?.replyKind, undefined);
  });

  it("still returns null for a non-object value", () => {
    assert.equal(parseFlow(null), null);
    assert.equal(parseFlow("x"), null);
  });
});
