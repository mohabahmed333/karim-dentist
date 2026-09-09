import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { typewriterFrames } from "./typewriterFrames.ts";

describe("typewriterFrames", () => {
  it("ends with the full text at exactly durationMs", () => {
    const frames = typewriterFrames("Tue 10:30 works", { durationMs: 800 });
    const last = frames[frames.length - 1];
    assert.equal(last.text, "Tue 10:30 works");
    assert.equal(last.at, 800);
  });

  it("frames are strictly increasing prefixes of the text", () => {
    const text = "Pain on biting 4 days";
    const frames = typewriterFrames(text, { durationMs: 1000 });
    let prevLen = -1;
    let prevAt = -1;
    for (const frame of frames) {
      assert.ok(text.startsWith(frame.text));
      assert.ok(frame.text.length > prevLen);
      assert.ok(frame.at >= prevAt);
      prevLen = frame.text.length;
      prevAt = frame.at;
    }
  });

  it("respects maxFrames on long text", () => {
    const text = "x".repeat(200);
    const frames = typewriterFrames(text, { durationMs: 5000, maxFrames: 24 });
    assert.ok(frames.length <= 24);
    assert.equal(frames[frames.length - 1].text, text);
  });

  it("returns a single empty frame for empty text", () => {
    const frames = typewriterFrames("", { durationMs: 500 });
    assert.deepEqual(frames, [{ at: 0, text: "" }]);
  });

  it("never produces more frames than characters", () => {
    const frames = typewriterFrames("hi", { durationMs: 1000, maxFrames: 24 });
    assert.ok(frames.length <= 3); // "", "h", "hi" at most
  });
});
