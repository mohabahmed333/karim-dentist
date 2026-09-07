import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  INBOX_WIDTH_DEFAULT,
  INBOX_WIDTH_MAX,
  INBOX_WIDTH_MIN,
  clampInboxWidth,
  nextInboxWidthFromDrag,
} from "./inboxColumnWidth.ts";

test("clamps inbox width between min and max", () => {
  assert.equal(clampInboxWidth(100), INBOX_WIDTH_MIN);
  assert.equal(clampInboxWidth(900), INBOX_WIDTH_MAX);
  assert.equal(clampInboxWidth(INBOX_WIDTH_DEFAULT), INBOX_WIDTH_DEFAULT);
});

test("drag right shrinks the inbox (reversed resize)", () => {
  assert.equal(nextInboxWidthFromDrag(400, 100, 140), 360);
  assert.equal(nextInboxWidthFromDrag(400, 100, 60), 440);
});
