import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseTranscriptionResponse, transcriptionErrorMessage } from "./parseTranscription.ts";

describe("parseTranscriptionResponse", () => {
  it("returns the transcribed text", () => {
    assert.equal(parseTranscriptionResponse({ text: "book a cleaning for tomorrow" }), "book a cleaning for tomorrow");
  });

  it("trims surrounding whitespace", () => {
    assert.equal(parseTranscriptionResponse({ text: "  hi there  \n" }), "hi there");
  });

  it("returns an empty string rather than throwing when text is missing", () => {
    assert.equal(parseTranscriptionResponse({}), "");
  });

  it("returns an empty string for a non-string text field", () => {
    assert.equal(parseTranscriptionResponse({ text: 42 }), "");
  });
});

describe("transcriptionErrorMessage", () => {
  it("keeps a short upstream detail readable", () => {
    assert.match(transcriptionErrorMessage(400, "invalid file format"), /invalid file format/);
  });

  it("truncates a very long upstream detail", () => {
    const msg = transcriptionErrorMessage(500, "x".repeat(500));
    assert.ok(msg.length < 300);
  });
});
