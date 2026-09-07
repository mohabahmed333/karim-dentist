import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  formatVoiceClock,
  pushWaveSample,
  waveBarHeightPx,
  seekRatioFromClientX,
  isPreviewAtEnd,
  previewStateAtEnd,
  previewProgressFromTime,
  shouldRestartFromStart,
} from "./voiceRecorderHelpers.ts";

describe("formatVoiceClock", () => {
  it("formats under a minute as m:ss", () => {
    assert.equal(formatVoiceClock(0), "0:00");
    assert.equal(formatVoiceClock(7), "0:07");
    assert.equal(formatVoiceClock(59), "0:59");
  });

  it("formats minutes without zero-padding the minute", () => {
    assert.equal(formatVoiceClock(60), "1:00");
    assert.equal(formatVoiceClock(125), "2:05");
  });
});

describe("pushWaveSample", () => {
  it("keeps a fixed-length ring of samples", () => {
    const next = pushWaveSample([0.1, 0.2], 0.9, 3);
    assert.deepEqual(next, [0.1, 0.2, 0.9]);
    assert.deepEqual(pushWaveSample(next, 0.4, 3), [0.2, 0.9, 0.4]);
  });

  it("clamps samples to 0–1", () => {
    assert.deepEqual(pushWaveSample([], 2, 4), [1]);
    assert.deepEqual(pushWaveSample([], -1, 4), [0]);
  });
});

describe("waveBarHeightPx", () => {
  it("returns a round dot at silence", () => {
    assert.equal(waveBarHeightPx(0, 22, 2), 2);
    assert.equal(waveBarHeightPx(0.02, 22, 2), 2);
  });

  it("scales up to nearly full track height", () => {
    assert.equal(waveBarHeightPx(1, 22, 2), 22);
    assert.ok(waveBarHeightPx(0.5, 22, 2) > 10);
  });
});

describe("seekRatioFromClientX", () => {
  it("maps LTR pointer to 0–1", () => {
    assert.equal(seekRatioFromClientX(50, 0, 100, false), 0.5);
    assert.equal(seekRatioFromClientX(-10, 0, 100, false), 0);
    assert.equal(seekRatioFromClientX(200, 0, 100, false), 1);
  });

  it("maps RTL pointer mirrored", () => {
    assert.equal(seekRatioFromClientX(25, 0, 100, true), 0.75);
  });
});

describe("preview end-of-playback", () => {
  it("detects the end from ended flag or near duration", () => {
    assert.equal(isPreviewAtEnd(3.95, 4, false), true);
    assert.equal(isPreviewAtEnd(2, 4, false), false);
    assert.equal(isPreviewAtEnd(0, 4, true), true);
  });

  it("snaps UI state to the end when playback finishes", () => {
    assert.deepEqual(previewStateAtEnd(4.2), {
      playing: false,
      progress: 1,
      seconds: 4.2,
    });
  });

  it("maps currentTime to progress and clamps at the end", () => {
    assert.equal(previewProgressFromTime(2, 4), 0.5);
    assert.equal(previewProgressFromTime(5, 4), 1);
    assert.equal(previewProgressFromTime(-1, 4), 0);
  });

  it("restarts from the start after finishing", () => {
    assert.equal(shouldRestartFromStart(1), true);
    assert.equal(shouldRestartFromStart(0.995), true);
    assert.equal(shouldRestartFromStart(0.5), false);
  });
});
