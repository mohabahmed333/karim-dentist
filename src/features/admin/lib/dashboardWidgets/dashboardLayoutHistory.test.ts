import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  emptyLayoutHistory,
  pushLayoutHistory,
  redoLayout,
  undoLayout,
} from "./dashboardLayoutHistory.ts";

const a = [{ id: "bookings" as const, colSpan: 6 as const }];
const b = [{ id: "bookings" as const, colSpan: 12 as const }];
const c = [{ id: "recent" as const, colSpan: 6 as const }];

test("undo restores previous layout and enables redo", () => {
  let history = emptyLayoutHistory();
  history = pushLayoutHistory(history, a);
  const undone = undoLayout(history, b);
  assert.ok(undone);
  assert.deepEqual(undone.layout, a);
  assert.equal(undone.history.past.length, 0);
  assert.equal(undone.history.future.length, 1);

  const redone = redoLayout(undone.history, undone.layout);
  assert.ok(redone);
  assert.deepEqual(redone.layout, b);
});

test("push clears redo stack", () => {
  let history = emptyLayoutHistory();
  history = pushLayoutHistory(history, a);
  const undone = undoLayout(history, b)!;
  history = pushLayoutHistory(undone.history, c);
  assert.equal(history.future.length, 0);
  assert.equal(redoLayout(history, c), null);
});
