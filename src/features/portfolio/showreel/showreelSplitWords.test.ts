import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitShowreelWords } from "./showreelSplitWords.ts";

describe("splitShowreelWords", () => {
  it("splits a normal sentence into words", () => {
    assert.deepEqual(splitShowreelWords("One connected clinic"), [
      "One",
      "connected",
      "clinic",
    ]);
  });

  it("returns a single-element array for one word", () => {
    assert.deepEqual(splitShowreelWords("Elbasiry"), ["Elbasiry"]);
  });

  it("collapses repeated internal whitespace", () => {
    assert.deepEqual(splitShowreelWords("Live   front    desk"), [
      "Live",
      "front",
      "desk",
    ]);
  });

  it("trims leading and trailing whitespace", () => {
    assert.deepEqual(splitShowreelWords("  Book with AI  "), [
      "Book",
      "with",
      "AI",
    ]);
  });

  it("returns an empty array for an empty or whitespace-only string", () => {
    assert.deepEqual(splitShowreelWords(""), []);
    assert.deepEqual(splitShowreelWords("   "), []);
  });
});
