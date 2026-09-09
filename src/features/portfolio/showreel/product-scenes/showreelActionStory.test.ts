import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { beatLabelAt, showreelBeats } from "./showreelActionStory.ts";

const STEPS = [
  { id: "a", at: 0, beat: "First beat" },
  { id: "b", at: 1000 },
  { id: "c", at: 2000, beat: "Second beat" },
  { id: "d", at: 3000 },
];

describe("beatLabelAt", () => {
  it("returns null before the first beat", () => {
    assert.equal(beatLabelAt(STEPS, -1), null);
  });

  it("holds the active beat through beat-less steps", () => {
    assert.equal(beatLabelAt(STEPS, 0), "First beat");
    assert.equal(beatLabelAt(STEPS, 1500), "First beat");
  });

  it("switches exactly at the next beat's step time", () => {
    assert.equal(beatLabelAt(STEPS, 1999), "First beat");
    assert.equal(beatLabelAt(STEPS, 2000), "Second beat");
    assert.equal(beatLabelAt(STEPS, 5000), "Second beat");
  });

  it("returns null when no step carries a beat", () => {
    assert.equal(beatLabelAt([{ id: "x", at: 0 }], 500), null);
  });
});

describe("showreelBeats", () => {
  it("lists only the steps that start a beat, in order", () => {
    assert.deepEqual(showreelBeats(STEPS), [
      { id: "a", at: 0, label: "First beat" },
      { id: "c", at: 2000, label: "Second beat" },
    ]);
  });

  it("returns an empty list when no step carries a beat", () => {
    assert.deepEqual(showreelBeats([{ id: "x", at: 0 }]), []);
  });
});
