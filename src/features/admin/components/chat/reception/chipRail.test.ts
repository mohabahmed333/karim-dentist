import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { isComposerStartSet } from "./chipRail.ts";

test("hides in-bubble chips when they duplicate the composer start set", () => {
  assert.equal(
    isComposerStartSet([
      { id: "start:website" },
      { id: "start:book" },
    ]),
    true,
  );
});

test("keeps contextual follow-up chips inside the bubble", () => {
  assert.equal(isComposerStartSet([{ id: "book:confirm" }]), false);
  assert.equal(
    isComposerStartSet([{ id: "start:book" }, { id: "book:confirm" }]),
    false,
  );
  assert.equal(isComposerStartSet([]), false);
});
