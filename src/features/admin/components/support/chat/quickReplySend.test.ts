import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { planQuickReplySend, WHATSAPP_CAPTION_LIMIT } from "./quickReplySend.ts";
import { INTERACTIVE_BODY_LIMIT } from "@/services/whatsapp/interactiveButtons";

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

const buttons = [
  { id: "qr_visit_1", title: "Confirm" },
  { id: "qr_visit_2", title: "Call me" },
];

describe("planQuickReplySend with buttons", () => {
  it("sends the text with its buttons as one message", () => {
    assert.deepEqual(planQuickReplySend("  See you soon  ", null, buttons), [
      { kind: "buttons", text: "See you soon", buttons },
    ]);
  });

  it("uses the default prompt when there is no text", () => {
    assert.deepEqual(planQuickReplySend("   ", null, buttons), [{ kind: "buttons", text: "", buttons }]);
  });

  it("keeps text of exactly the limit on the button message", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT);
    assert.deepEqual(planQuickReplySend(text, null, buttons), [{ kind: "buttons", text, buttons }]);
  });

  it("sends over-long text first, then the buttons with the prompt", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, null, buttons), [
      { kind: "text", text },
      { kind: "buttons", text: "", buttons },
    ]);
  });

  it("sends a file without a caption, then the text with buttons", () => {
    assert.deepEqual(planQuickReplySend("Our price list", pdf, buttons), [
      { kind: "file", caption: "" },
      { kind: "buttons", text: "Our price list", buttons },
    ]);
  });

  it("sends a file, then over-long text, then the buttons with the prompt", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, image, buttons), [
      { kind: "file", caption: "" },
      { kind: "text", text },
      { kind: "buttons", text: "", buttons },
    ]);
  });

  it("sends the pin first, then the text with buttons", () => {
    assert.deepEqual(planQuickReplySend("Find us here", { kind: "location" }, buttons), [
      { kind: "location" },
      { kind: "buttons", text: "Find us here", buttons },
    ]);
  });

  it("sends the pin, then over-long text, then the buttons with the prompt", () => {
    const text = "x".repeat(INTERACTIVE_BODY_LIMIT + 1);
    assert.deepEqual(planQuickReplySend(text, { kind: "location" }, buttons), [
      { kind: "location" },
      { kind: "text", text },
      { kind: "buttons", text: "", buttons },
    ]);
  });

  it("treats an empty button list as no buttons", () => {
    assert.deepEqual(planQuickReplySend("Hello", null, []), [{ kind: "text", text: "Hello" }]);
  });
});
