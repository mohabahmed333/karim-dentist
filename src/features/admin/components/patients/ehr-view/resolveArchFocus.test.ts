import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveArchFocus } from "./resolveArchFocus.ts";

const condition16 = { fdi: "16", toothUniversal: 3 };

describe("resolveArchFocus", () => {
  it("lets the tooth you clicked win over the still-active condition", () => {
    // #16 is the open condition; the user clicks universal 14 (FDI 26), which
    // has no condition of its own. The arch must follow the click.
    assert.deepEqual(
      resolveArchFocus({ selectedToothId: 14, condition: condition16 }),
      { universal: 14, fdi: "26" },
    );
  });

  it("falls back to the active condition when nothing is clicked", () => {
    assert.deepEqual(
      resolveArchFocus({ selectedToothId: null, condition: condition16 }),
      { universal: 3, fdi: "16" },
    );
  });

  it("uses the condition's fdi when it has no universal", () => {
    assert.deepEqual(
      resolveArchFocus({
        selectedToothId: null,
        condition: { fdi: "26", toothUniversal: null },
      }),
      { universal: null, fdi: "26" },
    );
  });

  it("resolves to nothing with no click and no condition", () => {
    assert.deepEqual(
      resolveArchFocus({ selectedToothId: null, condition: null }),
      { universal: null, fdi: null },
    );
  });
});
