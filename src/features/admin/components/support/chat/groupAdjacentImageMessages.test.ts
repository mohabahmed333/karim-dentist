import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { groupAdjacentImageMessages } from "./groupAdjacentImageMessages.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import type { SupportMessage } from "../supportDummyData.ts";

function img(
  id: string,
  url: string,
  at: string,
): SupportMessage {
  return {
    id,
    author: "customer",
    authorName: "Patient",
    body: "",
    time: "12:00",
    messageType: "image",
    waTimestamp: at,
    media: [{ url, mime: "image/jpeg" }],
  };
}

describe("groupAdjacentImageMessages", () => {
  it("merges consecutive images into one grid", () => {
    const grouped = groupAdjacentImageMessages([
      img("1", "https://cdn/a.jpg", "2026-09-07T18:00:00.000Z"),
      img("2", "https://cdn/b.jpg", "2026-09-07T18:00:05.000Z"),
      img("3", "https://cdn/c.jpg", "2026-09-07T18:00:10.000Z"),
    ]);
    assert.equal(grouped.length, 1);
    assert.equal(grouped[0]?.media?.length, 3);
  });

  it("does not merge across authors or long gaps", () => {
    const second: SupportMessage = {
      ...img("2", "https://cdn/b.jpg", "2026-09-07T18:10:00.000Z"),
    };
    const grouped = groupAdjacentImageMessages([
      img("1", "https://cdn/a.jpg", "2026-09-07T18:00:00.000Z"),
      second,
    ]);
    assert.equal(grouped.length, 2);
  });
});
