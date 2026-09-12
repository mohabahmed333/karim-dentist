import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { modelTranscript, MODEL_TURN_CHARS, MODEL_TURNS } from "./clinicAssistTranscript.ts";

const WELCOME = "Hi — I'm Clinic Assist.";

describe("modelTranscript", () => {
  it("leaves out the seeded welcome and empty turns", () => {
    const out = modelTranscript(
      [
        { role: "assistant", content: WELCOME },
        { role: "user", content: "" },
        { role: "user", content: "what's today like?" },
      ],
      [WELCOME, "legacy welcome"],
    );
    assert.deepEqual(out, [{ role: "user", content: "what's today like?" }]);
  });

  it("recognises a welcome saved in the other language", () => {
    const out = modelTranscript(
      [
        { role: "assistant", content: "legacy welcome" },
        { role: "user", content: "hi" },
      ],
      [WELCOME, "legacy welcome"],
    );
    assert.equal(out.length, 1);
  });

  /**
   * A pasted SOAP note used to exceed the route's 2000-character limit, and
   * because it stayed in the last 12 turns every later message 400'd too.
   */
  it("trims a long message instead of letting it break the thread", () => {
    const out = modelTranscript([{ role: "user", content: "x".repeat(5000) }], []);
    assert.equal(out[0]?.content.length, MODEL_TURN_CHARS + 1);
    assert.ok(out[0]?.content.endsWith("…"));
  });

  it("keeps only the most recent turns", () => {
    const messages = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `m${i}`,
    }));
    const out = modelTranscript(messages, []);
    assert.equal(out.length, MODEL_TURNS);
    assert.equal(out.at(-1)?.content, "m29");
  });

  it("drops extra fields so only role and content are sent", () => {
    const out = modelTranscript(
      [{ role: "user", content: "hi", at: "10:00", meta: { actions: [] } } as never],
      [],
    );
    assert.deepEqual(Object.keys(out[0] ?? {}).sort(), ["content", "role"]);
  });
});
