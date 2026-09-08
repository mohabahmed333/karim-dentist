import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { syncPreviewIframeStyles } from "./syncPreviewIframeStyles.ts";

describe("syncPreviewIframeStyles", () => {
  it("is a function that accepts two documents", () => {
    assert.equal(typeof syncPreviewIframeStyles, "function");
    assert.equal(syncPreviewIframeStyles.length, 2);
  });
});
