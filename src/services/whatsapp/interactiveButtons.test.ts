import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { checkInteractiveButtons, INTERACTIVE_BODY_LIMIT } from "./interactiveButtons.ts";

describe("checkInteractiveButtons", () => {
  const two = [{ title: "Confirm" }, { title: "Call me" }];

  it("accepts text within the limit with distinct titles", () => {
    assert.equal(checkInteractiveButtons("See you soon", two), null);
    assert.equal(checkInteractiveButtons("x".repeat(INTERACTIVE_BODY_LIMIT), two), null);
  });

  it("rejects a message without buttons", () => {
    assert.equal(checkInteractiveButtons("Hi", undefined), "no_buttons");
    assert.equal(checkInteractiveButtons("Hi", []), "no_buttons");
  });

  it("rejects text over WhatsApp's limit", () => {
    assert.equal(checkInteractiveButtons("x".repeat(INTERACTIVE_BODY_LIMIT + 1), two), "body_too_long");
  });

  it("rejects titles that differ only in case or spaces", () => {
    assert.equal(checkInteractiveButtons("Hi", [{ title: "Yes" }, { title: " yes" }]), "duplicate_titles");
  });
});
