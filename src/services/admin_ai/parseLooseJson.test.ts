import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseLooseJsonObject } from "./parseLooseJson.ts";

describe("parseLooseJsonObject", () => {
  it("parses a bare JSON object", () => {
    assert.deepEqual(parseLooseJsonObject('{"a": 1}'), { a: 1 });
  });

  it("parses a fenced JSON object after prose", () => {
    assert.deepEqual(
      parseLooseJsonObject('Sure, here it is.\n```json\n{"a": 1}\n```'),
      { a: 1 },
    );
  });

  it("recovers a JSON object embedded in prose with no fence", () => {
    assert.deepEqual(
      parseLooseJsonObject('Here you go: {"a": 1} — done.'),
      { a: 1 },
    );
  });

  it("returns null for plain prose", () => {
    assert.equal(parseLooseJsonObject("There are no open slots tomorrow."), null);
  });

  it("returns null for a JSON array, since callers expect an object", () => {
    assert.equal(parseLooseJsonObject("[1, 2, 3]"), null);
  });

  it("returns null for truncated JSON instead of throwing", () => {
    assert.equal(parseLooseJsonObject('{"a": 1, "b":'), null);
  });

  it("returns null for an unclosed fence", () => {
    assert.equal(parseLooseJsonObject('```json\n{"a": 1'), null);
  });
});
