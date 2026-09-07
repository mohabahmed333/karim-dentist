import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { indexOfGalleryImage } from "./chatGallery.ts";

describe("indexOfGalleryImage", () => {
  const images = [
    { id: "a", url: "https://cdn/a.jpg" },
    { id: "b", url: "https://cdn/b.jpg", name: "b" },
    { id: "c", url: "https://cdn/a.jpg" },
  ];

  it("returns the first matching url index", () => {
    assert.equal(indexOfGalleryImage(images, "https://cdn/a.jpg"), 0);
    assert.equal(indexOfGalleryImage(images, "https://cdn/b.jpg"), 1);
  });

  it("returns -1 when missing", () => {
    assert.equal(indexOfGalleryImage(images, "https://cdn/missing.jpg"), -1);
  });
});
