import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  INDEX_PAGE_SIZE,
  hasMoreItems,
  initialVisibleCount,
  nextVisibleCount,
  pagesNeeded,
  visibleItems,
} from "./infiniteBatch.ts";

test("page size is six items per batch", () => {
  assert.equal(INDEX_PAGE_SIZE, 6);
});

test("starts with at most one page of items", () => {
  assert.equal(initialVisibleCount(20, 6), 6);
  assert.equal(initialVisibleCount(3, 6), 3);
  assert.equal(initialVisibleCount(0, 6), 0);
});

test("appends another page without passing the total", () => {
  assert.equal(nextVisibleCount(6, 20, 6), 12);
  assert.equal(nextVisibleCount(18, 20, 6), 20);
  assert.equal(nextVisibleCount(20, 20, 6), 20);
});

test("slices visible items only while batching is enabled", () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  assert.deepEqual(visibleItems(items, 6, true), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(visibleItems(items, 6, false), items);
});

test("hasMore is false when disabled or fully revealed", () => {
  assert.equal(hasMoreItems(6, 14, true), true);
  assert.equal(hasMoreItems(14, 14, true), false);
  assert.equal(hasMoreItems(6, 14, false), false);
});

test("counts how many scroll batches a list needs", () => {
  assert.equal(pagesNeeded(14, 6), 3);
  assert.equal(pagesNeeded(6, 6), 1);
  assert.equal(pagesNeeded(0, 6), 0);
});
