import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { boxAnchor, calculateBezierPathFromRects, cubicBezierPath } from "./bezier.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { archTeeth } from "./archLayout.ts";

describe("history dashboard geometry", () => {
  it("builds a cubic bezier from right-edge to left-edge anchors", () => {
    const from = boxAnchor({ left: 10, top: 20, width: 80, height: 40 }, "right");
    const to = boxAnchor({ left: 300, top: 80, width: 120, height: 60 }, "left");
    assert.equal(from.x, 90);
    assert.equal(from.y, 40);
    assert.equal(to.x, 300);
    assert.equal(to.y, 110);
    const d = cubicBezierPath(from, to);
    assert.match(d, /^M 90.0 40.0 C /);
    assert.match(d, /, 300.0 110.0$/);
  });

  it("builds midpoint control bezier paths from DOM rects", () => {
    const container = { left: 0, top: 0, width: 800, height: 600, right: 800, bottom: 600 };
    const source = { left: 120, top: 200, width: 180, height: 48, right: 300, bottom: 248 };
    const target = { left: 420, top: 260, width: 220, height: 72, right: 640, bottom: 332 };
    const d = calculateBezierPathFromRects(source, target, container);
    assert.match(d, /^M 300.0 224.0 C /);
    assert.match(d, /420.0 296.0$/);
  });

  it("places 32 unique universal teeth with dentist-view laterality", () => {
    const teeth = archTeeth();
    assert.equal(teeth.length, 32);
    assert.equal(new Set(teeth.map((t) => t.universal)).size, 32);
    const one = teeth.find((t) => t.universal === 1);
    const sixteen = teeth.find((t) => t.universal === 16);
    assert.ok(one && sixteen);
    assert.ok(one.x < 0, "tooth #1 sits on the clinician's left");
    assert.ok(sixteen.x > 0, "tooth #16 sits on the clinician's right");
    assert.ok(one.y > 0 && sixteen.y > 0);
  });
});
