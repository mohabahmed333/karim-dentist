import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { planQuickReplySend, WHATSAPP_CAPTION_LIMIT } from "./quickReplySend.ts";

const image = { kind: "image", mime: "image/png", path: "p.png", name: "p.png", size: 10 } as const;
const pdf = { kind: "document", mime: "application/pdf", path: "p.pdf", name: "p.pdf", size: 10 } as const;

describe("planQuickReplySend", () => {
  it("sends plain text when there is no attachment", () => {
    assert.deepEqual(planQuickReplySend("  Hello  ", null), [{ kind: "text", text: "Hello" }]);
  });

  it("sends nothing for empty text and no attachment", () => {
    assert.deepEqual(planQuickReplySend("   ", null), []);
  });

  it("sends a file with the text as its caption, as one message", () => {
    assert.deepEqual(planQuickReplySend("Our price list", pdf), [{ kind: "file", caption: "Our price list" }]);
  });

  it("keeps a caption of exactly the limit on the file", () => {
    const text = "x".repeat(WHATSAPP_CAPTION_LIMIT);
    assert.deepEqual(planQuickReplySend(text, image), [{ kind: "file", caption: text }]);
  });

  it("sends over-long text first, then the file without a caption", () => {
    const text = "x".repeat(WHATSAPP_CAPTION_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, image), [
      { kind: "text", text },
      { kind: "file", caption: "" },
    ]);
  });

  it("sends the text before a location pin, which cannot carry a caption", () => {
    assert.deepEqual(planQuickReplySend("Find us here", { kind: "location" }), [
      { kind: "text", text: "Find us here" },
      { kind: "location" },
    ]);
  });

  it("sends only the pin when there is no text", () => {
    assert.deepEqual(planQuickReplySend("", { kind: "location" }), [{ kind: "location" }]);
  });
});
