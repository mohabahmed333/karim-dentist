import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { readClinicAssistStream } from "./clinicAssistStream.ts";

function sseResponse(...blocks: { event: string; data: unknown }[]) {
  const text = blocks
    .map((b) => `event: ${b.event}\ndata: ${JSON.stringify(b.data)}\n\n`)
    .join("");
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Split into two chunks to exercise buffering across reads, not just
      // one convenient whole-block-per-read case.
      const bytes = encoder.encode(text);
      const mid = Math.floor(bytes.length / 2);
      controller.enqueue(bytes.slice(0, mid));
      controller.enqueue(bytes.slice(mid));
      controller.close();
    },
  });
  return new Response(stream);
}

describe("readClinicAssistStream", () => {
  it("delivers a status event", async () => {
    const events: unknown[] = [];
    await readClinicAssistStream(sseResponse({ event: "status", data: { text: "Looking up Ali…" } }), (e) =>
      events.push(e),
    );
    assert.deepEqual(events, [{ type: "status", text: "Looking up Ali…" }]);
  });

  it("delivers the final payload on a done event", async () => {
    const events: unknown[] = [];
    const payload = { reply: "Hi", suggestedActions: [], proposedActions: [] };
    await readClinicAssistStream(sseResponse({ event: "done", data: payload }), (e) => events.push(e));
    assert.deepEqual(events, [{ type: "done", payload }]);
  });

  it("delivers an error event", async () => {
    const events: unknown[] = [];
    await readClinicAssistStream(sseResponse({ event: "error", data: { error: "boom" } }), (e) =>
      events.push(e),
    );
    assert.deepEqual(events, [{ type: "error", error: "boom" }]);
  });

  it("delivers events in order across a status → status → done sequence", async () => {
    const events: unknown[] = [];
    await readClinicAssistStream(
      sseResponse(
        { event: "status", data: { text: "a" } },
        { event: "status", data: { text: "b" } },
        { event: "done", data: { reply: "done", suggestedActions: [], proposedActions: [] } },
      ),
      (e) => events.push(e),
    );
    assert.deepEqual(events, [
      { type: "status", text: "a" },
      { type: "status", text: "b" },
      { type: "done", payload: { reply: "done", suggestedActions: [], proposedActions: [] } },
    ]);
  });

  it("ignores an unknown event name rather than throwing", async () => {
    const events: unknown[] = [];
    await readClinicAssistStream(sseResponse({ event: "ping", data: {} }), (e) => events.push(e));
    assert.deepEqual(events, []);
  });

  it("throws if the response has no body", async () => {
    await assert.rejects(() => readClinicAssistStream(new Response(null), () => {}));
  });
});
