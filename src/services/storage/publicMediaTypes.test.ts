import { describe, expect, it } from "vitest";
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
    expect(decodeMediaCursor(encodeMediaCursor(cursor))).toEqual(cursor);
  });

  it("returns null for junk", () => {
    expect(decodeMediaCursor("not-valid")).toBeNull();
    expect(decodeMediaCursor(null)).toBeNull();
  });

  it("starts at first bucket root", () => {
    expect(initialMediaCursor()).toEqual({
      bucketIndex: 0,
      stack: [{ prefix: "", offset: 0 }],
    });
  });
});
