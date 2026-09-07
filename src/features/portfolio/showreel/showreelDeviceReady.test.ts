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

test("does not reveal a site embed before its hero video is ready", () => {
  const root = {
    querySelector() {
      return { readyState: 1, classList: { contains: () => false } };
    },
  };

  assert.equal(isShowreelEmbedReady(root, "site"), false);
});
