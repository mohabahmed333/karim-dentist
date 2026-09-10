import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  decodeMediaCursor,
  encodeMediaCursor,
  initialMediaCursor,
} from "./publicMediaTypes";

describe("publicMedia cursor codec", () => {
  it("round-trips cursor", () => {
    const cursor = {
      bucketIndex: 2,
      stack: [
        { prefix: "about", offset: 40 },
        { prefix: "about/contact", offset: 0 },
      ],
    };
    assert.deepEqual(decodeMediaCursor(encodeMediaCursor(cursor)), cursor);
  });

  it("returns null for junk", () => {
    assert.equal(decodeMediaCursor("not-valid"), null);
    assert.equal(decodeMediaCursor(null), null);
  });

  it("starts at first bucket root", () => {
    assert.deepEqual(initialMediaCursor(), {
      bucketIndex: 0,
      stack: [{ prefix: "", offset: 0 }],
    });
  });
});
