import assert from "node:assert/strict";
import test from "node:test";
import type { GalleryItem } from "../../../services/dental/types.ts";
import {
  resolveMosaicCenterImages,
  resolveMosaicSideImages,
} from "./mosaicHeroImages.ts";

test("resolveMosaicCenterImages puts hero first then gallery", () => {
  const gallery: GalleryItem[] = [
    {
      id: "1",
      image_url: "/a.jpg",
      caption: "",
      caption_ar: "",
      category: "clinic",
      sort_order: 0,
      is_published: true,
    },
    {
      id: "2",
      image_url: "/hero.jpg",
      caption: "",
      caption_ar: "",
      category: "clinic",
      sort_order: 1,
      is_published: true,
    },
  ];
  const urls = resolveMosaicCenterImages("/hero.jpg", gallery);
  assert.equal(urls[0], "/hero.jpg");
  assert.ok(urls.includes("/a.jpg"));
  assert.equal(urls.filter((u) => u === "/hero.jpg").length, 1);
});

test("resolveMosaicSideImages skips center and fills three", () => {
  const [a, b, c] = resolveMosaicSideImages([], "/missing.jpg");
  assert.ok(a && b && c);
  assert.notEqual(a, "/missing.jpg");
});
