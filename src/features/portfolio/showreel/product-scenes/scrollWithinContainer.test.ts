import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { centeredScrollTop } from "./scrollWithinContainer.ts";

describe("centeredScrollTop", () => {
  it("centres the element in the container", () => {
    // element 100 tall at offset 500, container 400 tall -> 500 - 150 = 350
    assert.equal(centeredScrollTop(500, 100, 400, 10_000), 350);
  });

  it("never scrolls above the top", () => {
    assert.equal(centeredScrollTop(10, 100, 400, 10_000), 0);
  });

  it("never scrolls past the bottom", () => {
    assert.equal(centeredScrollTop(9_000, 100, 400, 1_000), 1_000);
  });

  it("stays at 0 when the container cannot scroll", () => {
    assert.equal(centeredScrollTop(500, 100, 400, 0), 0);
  });

  it("treats a negative max scroll as no scrolling", () => {
    assert.equal(centeredScrollTop(500, 100, 400, -50), 0);
  });

  it("handles an element taller than the container", () => {
    // 600-tall element in a 400 container -> aligns its top, clamped
    assert.equal(centeredScrollTop(500, 600, 400, 10_000), 600);
  });
});
