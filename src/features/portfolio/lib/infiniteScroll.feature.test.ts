import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { shouldFireNearEnd } from "./carouselNearEnd.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  INDEX_PAGE_SIZE,
  hasMoreItems,
  initialVisibleCount,
  nextVisibleCount,
  pagesNeeded,
  visibleItems,
} from "./infiniteBatch.ts";

function ids(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `item-${i + 1}`);
}

test("case studies index: first paint shows one page, scroll loads the rest", () => {
  const items = ids(14);
  let count = initialVisibleCount(items.length, INDEX_PAGE_SIZE);
  assert.deepEqual(visibleItems(items, count, true), ids(6));
  assert.equal(hasMoreItems(count, items.length, true), true);

  count = nextVisibleCount(count, items.length, INDEX_PAGE_SIZE);
  assert.equal(visibleItems(items, count, true).length, 12);
  assert.equal(hasMoreItems(count, items.length, true), true);

  count = nextVisibleCount(count, items.length, INDEX_PAGE_SIZE);
  assert.deepEqual(visibleItems(items, count, true), items);
  assert.equal(hasMoreItems(count, items.length, true), false);
  assert.equal(pagesNeeded(items.length, INDEX_PAGE_SIZE), 3);
});

test("featured index: short lists stay fully visible with no sentinel", () => {
  const items = ids(4);
  const count = initialVisibleCount(items.length, INDEX_PAGE_SIZE);
  assert.deepEqual(visibleItems(items, count, true), items);
  assert.equal(hasMoreItems(count, items.length, true), false);
});

test("homepage carousel: near-end scroll appends the next batch", () => {
  const items = ids(8);
  let count = initialVisibleCount(items.length, INDEX_PAGE_SIZE);
  assert.equal(visibleItems(items, count, true).length, 6);

  assert.equal(shouldFireNearEnd(false, 0.85, true), true);
  count = nextVisibleCount(count, items.length, INDEX_PAGE_SIZE);
  assert.deepEqual(visibleItems(items, count, true), items);
  assert.equal(shouldFireNearEnd(true, 0.95, false), false);
});

test("customize preview disables batching so every card is editable", () => {
  const items = ids(11);
  const count = initialVisibleCount(items.length, INDEX_PAGE_SIZE);
  assert.deepEqual(visibleItems(items, count, false), items);
  assert.equal(hasMoreItems(count, items.length, false), false);
});

test("growing the list after create resets to a fresh first page", () => {
  let total = 7;
  let count = initialVisibleCount(total, INDEX_PAGE_SIZE);
  count = nextVisibleCount(count, total, INDEX_PAGE_SIZE);
  assert.equal(count, 7);

  total = 9;
  count = initialVisibleCount(total, INDEX_PAGE_SIZE);
  assert.equal(count, 6);
  assert.equal(hasMoreItems(count, total, true), true);
});
