import assert from "node:assert/strict";
import test from "node:test";
import { isShowreelEmbedReady } from "./showreelDeviceReady.ts";

test("recognizes an already-ready site hero after its message was missed", () => {
  const root = {
    querySelector(selector: string) {
      if (selector === "video.scrub-video") {
        return { readyState: 4, classList: { contains: () => true } };
      }
      return null;
    },
  };

  assert.equal(isShowreelEmbedReady(root, "site"), true);
});

test("recognizes the dental homepage hero as a ready site embed", () => {
  const root = {
    querySelector(selector: string) {
      return selector === '[data-customize-section="hero"]' ? {} : null;
    },
  };

  assert.equal(isShowreelEmbedReady(root, "site"), true);
});

test("does not reveal a site embed before its hero video is ready", () => {
  const root = {
    querySelector(selector: string) {
      if (selector === "video.scrub-video") {
        return { readyState: 1, classList: { contains: () => false } };
      }
      return null;
    },
  };

  assert.equal(isShowreelEmbedReady(root, "site"), false);
});

test("recognizes product demo chrome as ready", () => {
  const root = {
    querySelector(selector: string) {
      return selector === ".showreel-product-chrome" ? {} : null;
    },
  };
  assert.equal(isShowreelEmbedReady(root, "product"), true);
});

test("recognizes real admin product demos as ready", () => {
  const root = {
    querySelector(selector: string) {
      return selector === "[data-showreel-demo]" ? {} : null;
    },
  };
  assert.equal(isShowreelEmbedReady(root, "product"), true);
});
