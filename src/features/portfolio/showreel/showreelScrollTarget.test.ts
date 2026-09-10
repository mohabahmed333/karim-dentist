import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { showreelScrollTargetY } from "./showreelScrollTarget.ts";

/** Minimal stand-in for an iframe's window. */
function fakeWin(scrollHeight: number, innerHeight = 800) {
  return {
    innerHeight,
    scrollY: 0,
    document: {
      documentElement: { scrollHeight },
      querySelector: () => null,
      getElementById: () => null,
    },
  } as unknown as Window;
}

describe("showreelScrollTargetY", () => {
  it("lands on the very bottom at full progress and full depth", () => {
    assert.equal(
      showreelScrollTargetY(fakeWin(3000), 1, { maxProgress: 1 }),
      2200,
    );
  });

  it("stops at the configured depth for a partial scroll", () => {
    assert.equal(
      showreelScrollTargetY(fakeWin(3000), 1, { maxProgress: 0.5 }),
      1100,
    );
  });

  it("re-measures a page that grew after the scroll ended", () => {
    // Lazy content below the fold only loads once the scroll reaches it, so
    // the bottom moves. Asking again must return the new bottom, not the old.
    const before = showreelScrollTargetY(fakeWin(3000), 1, { maxProgress: 1 });
    const after = showreelScrollTargetY(fakeWin(5000), 1, { maxProgress: 1 });
    assert.equal(before, 2200);
    assert.equal(after, 4200);
  });

  it("never returns a negative offset for a page shorter than the viewport", () => {
    assert.equal(showreelScrollTargetY(fakeWin(400), 1, { maxProgress: 1 }), 0);
  });
});
