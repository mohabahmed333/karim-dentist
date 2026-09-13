import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { receiptMediaUrl } from "./receiptMedia.ts";

describe("receiptMediaUrl", () => {
  it("prefers the distilled media column", () => {
    const url = receiptMediaUrl(
      [{ url: "https://a.test/1.jpg", mime: "image/jpeg" }],
      { image: { link: "https://b.test/2.jpg" } },
    );
    assert.equal(url, "https://a.test/1.jpg");
  });

  it("skips a media entry with no url", () => {
    const url = receiptMediaUrl(
      [{ mime: "image/jpeg" }, { url: "https://a.test/2.jpg" }],
      {},
    );
    assert.equal(url, "https://a.test/2.jpg");
  });

  it("falls back to raw.image.link, then .url, then kapso.media_url", () => {
    // The shape a real production row has: raw.image carries both link and url.
    assert.equal(
      receiptMediaUrl([], { image: { link: "https://l.test/a.jpg", url: "https://u.test/a.jpg" } }),
      "https://l.test/a.jpg",
    );
    assert.equal(receiptMediaUrl([], { image: { url: "https://u.test/a.jpg" } }), "https://u.test/a.jpg");
    assert.equal(receiptMediaUrl([], { kapso: { media_url: "https://k.test/a.jpg" } }), "https://k.test/a.jpg");
  });

  it("returns an empty string when there is nothing to fetch", () => {
    assert.equal(receiptMediaUrl(null, null), "");
    assert.equal(receiptMediaUrl([], {}), "");
    assert.equal(receiptMediaUrl([{ url: "   " }], { image: {} }), "");
  });

  it("survives the columns being any shape at all", () => {
    // Both are jsonb: nothing guarantees what a vendor put there.
    assert.equal(receiptMediaUrl("not an array", 42), "");
    assert.equal(receiptMediaUrl([null, 7], { image: "nope", kapso: [] }), "");
  });

  it("trims surrounding whitespace, which would break a fetch", () => {
    assert.equal(receiptMediaUrl([{ url: "  https://a.test/1.jpg  " }], {}), "https://a.test/1.jpg");
  });
});
