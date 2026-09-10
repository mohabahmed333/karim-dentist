import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractKapsoTranscript, isSpeechTranscript } from "./transcript.ts";

describe("extractKapsoTranscript", () => {
  it("reads the structured field production actually sends", () => {
    // Real shape from an inbound voice note: { transcript: { text: "…" } }
    assert.equal(
      extractKapsoTranscript({ transcript: { text: "  عايز أحجز ميعاد  " } }),
      "عايز أحجز ميعاد",
    );
  });

  it("accepts a plain string, in case the shape is simplified later", () => {
    assert.equal(extractKapsoTranscript({ transcript: "hello" }), "hello");
  });

  it("returns empty when transcription has not finished", () => {
    // processing_status is 'pending' on arrival, so this is routine.
    assert.equal(extractKapsoTranscript({ processing_status: "pending" }), "");
    assert.equal(extractKapsoTranscript({ transcript: null }), "");
    assert.equal(extractKapsoTranscript(null), "");
    assert.equal(extractKapsoTranscript("nonsense"), "");
  });
});

describe("isSpeechTranscript", () => {
  it("accepts real speech in either language", () => {
    assert.equal(isSpeechTranscript("عايز أحجز ميعاد بكرة"), true);
    assert.equal(isSpeechTranscript("hi, can I move my appointment?"), true);
  });

  it("rejects Whisper's non-speech markers", () => {
    // Production already contains exactly this one. Passing it to the model
    // would have the assistant answer something no patient said.
    assert.equal(isSpeechTranscript("[outro jingle]"), false);
    assert.equal(isSpeechTranscript("[music]"), false);
    assert.equal(isSpeechTranscript("[inaudible]"), false);
    assert.equal(isSpeechTranscript("(silence)"), false);
    assert.equal(isSpeechTranscript("[music] [applause]"), false);
  });

  it("keeps speech that merely contains a marker", () => {
    assert.equal(isSpeechTranscript("[music] hello, are you open today?"), true);
  });

  it("rejects empty and punctuation-only transcripts", () => {
    assert.equal(isSpeechTranscript(""), false);
    assert.equal(isSpeechTranscript("   "), false);
    assert.equal(isSpeechTranscript("... ?!"), false);
  });
});
