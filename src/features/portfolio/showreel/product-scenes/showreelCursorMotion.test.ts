import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  arcOffset,
  hasArrived,
  magnetScale,
  springConfigFor,
  tiltFor,
} from "./showreelCursorMotion.ts";

describe("springConfigFor", () => {
  it("snaps on short hops and glides on long travels", () => {
    const short = springConfigFor(0);
    const long = springConfigFor(900);
    assert.equal(short.stiffness, 420);
    assert.equal(short.damping, 34);
    assert.equal(long.stiffness, 180);
    assert.equal(long.damping, 26);
  });

  it("interpolates monotonically between the ends", () => {
    const mid = springConfigFor(450);
    assert.ok(mid.stiffness < 420 && mid.stiffness > 180);
    assert.ok(mid.damping < 34 && mid.damping > 26);
  });

  it("clamps beyond the far end so huge jumps stay stable", () => {
    assert.deepEqual(springConfigFor(5000), springConfigFor(900));
  });

  it("treats negative distance as zero", () => {
    assert.deepEqual(springConfigFor(-10), springConfigFor(0));
  });
});

describe("hasArrived", () => {
  it("is true inside the tolerance radius", () => {
    assert.equal(hasArrived({ x: 100, y: 100 }, { x: 102, y: 101 }), true);
  });

  it("is false outside the tolerance radius", () => {
    assert.equal(hasArrived({ x: 100, y: 100 }, { x: 120, y: 100 }), false);
  });

  it("treats the tolerance edge as arrived", () => {
    assert.equal(hasArrived({ x: 0, y: 0 }, { x: 4, y: 0 }, 4), true);
  });
});

describe("arcOffset", () => {
  it("is zero at both ends of the flight", () => {
    assert.equal(arcOffset(0, 500), 0);
    assert.equal(arcOffset(1, 500), 0);
  });

  it("peaks at mid-flight", () => {
    const peak = arcOffset(0.5, 500);
    assert.ok(peak > arcOffset(0.25, 500));
    assert.ok(peak > arcOffset(0.75, 500));
  });

  it("caps the bow so long travels do not fly off screen", () => {
    assert.equal(arcOffset(0.5, 100000), 42);
  });

  it("does not bow a zero-distance move", () => {
    assert.equal(arcOffset(0.5, 0), 0);
  });
});

describe("tiltFor", () => {
  it("leans right when travelling right", () => {
    assert.equal(tiltFor(100, 0), 12);
  });

  it("leans left when travelling left", () => {
    assert.equal(tiltFor(-100, 0), -12);
  });

  it("stays upright when barely moving", () => {
    assert.equal(tiltFor(0.2, 0.2), 0);
  });

  it("stays upright on purely vertical travel", () => {
    assert.equal(tiltFor(0, 100), 0);
  });
});

describe("magnetScale", () => {
  it("does not pull outside the radius", () => {
    assert.equal(magnetScale(200), 1);
    assert.equal(magnetScale(64, 64), 1);
  });

  it("pulls hardest at the target", () => {
    assert.equal(magnetScale(0, 64, 1.6), 1.6);
  });

  it("ramps monotonically toward the target", () => {
    const far = magnetScale(48, 64, 1.6);
    const near = magnetScale(16, 64, 1.6);
    assert.ok(near > far);
    assert.ok(far > 1);
  });

  it("treats negative distance as zero", () => {
    assert.equal(magnetScale(-5, 64, 1.6), 1.6);
  });
});
