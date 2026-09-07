import assert from "node:assert/strict";
import test from "node:test";
import {
  parseServiceFilter,
  serializeServiceFilter,
  toggleServiceId,
} from "./serviceFilter.ts";

test("parseServiceFilter treats all and empty as no selection", () => {
  assert.deepEqual(parseServiceFilter("all"), []);
  assert.deepEqual(parseServiceFilter(""), []);
  assert.deepEqual(parseServiceFilter(null), []);
});

test("parseServiceFilter splits comma-separated ids", () => {
  assert.deepEqual(parseServiceFilter("a,b,c"), ["a", "b", "c"]);
  assert.deepEqual(parseServiceFilter(" a , b "), ["a", "b"]);
});

test("serializeServiceFilter uses all when empty", () => {
  assert.equal(serializeServiceFilter([]), "all");
  assert.equal(serializeServiceFilter(["a", "b"]), "a,b");
});

test("toggleServiceId adds and removes ids", () => {
  assert.deepEqual(toggleServiceId(["a"], "b"), ["a", "b"]);
  assert.deepEqual(toggleServiceId(["a", "b"], "a"), ["b"]);
});
