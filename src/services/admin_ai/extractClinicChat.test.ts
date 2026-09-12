import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractClinicChatPayload } from "./extractClinicChat.ts";

const defaults = [{ id: "start:book", label: "Book" }];

describe("extractClinicChatPayload", () => {
  it("parses proposedActions without claiming writes succeeded", () => {
    const raw = `Review these changes.

\`\`\`json
{
  "reply": "Ready to mark decay on 16 — confirm to save.",
  "suggestedActions": [{ "id": "start:note", "label": "Note" }],
  "proposedActions": [{
    "id": "a1",
    "kind": "chart.set_surfaces",
    "label": "Mark decay on 16",
    "dependsOn": [],
    "payload": { "patientKey": "p1", "fdi": "16", "occlusal": "decay" }
  }]
}
\`\`\``;
    const out = extractClinicChatPayload(raw, defaults);
    assert.match(out.reply, /confirm/i);
    assert.equal(out.proposedActions.length, 1);
    assert.equal(out.proposedActions[0]?.kind, "chart.set_surfaces");
    assert.equal(out.suggestedActions[0]?.id, "start:note");
  });

  it("rejects disallowed action kinds from the model", () => {
    const raw = `\`\`\`json
{ "reply": "ok", "proposedActions": [{ "id": "x", "kind": "sql.drop", "label": "x", "payload": {} }] }
\`\`\``;
    const out = extractClinicChatPayload(raw, defaults);
    assert.equal(out.proposedActions.length, 0);
    assert.equal(out.dropped, 1);
  });

  it("parses a bare JSON object, which is what JSON mode returns", () => {
    const raw = JSON.stringify({
      reply: "Tomorrow at 10:00 is open.",
      suggestedActions: [{ id: "patient:book", label: "Book for Ali" }],
    });
    const out = extractClinicChatPayload(raw);
    assert.equal(out.reply, "Tomorrow at 10:00 is open.");
    assert.equal(out.suggestedActions[0]?.id, "patient:book");
  });

  it("returns no chips when the model offers none and no defaults are given", () => {
    const out = extractClinicChatPayload(JSON.stringify({ reply: "Done." }));
    assert.deepEqual(out.suggestedActions, []);
  });

  it("never shows staff a truncated JSON object as the reply", () => {
    const out = extractClinicChatPayload('{"reply": "Booked Ali for", "proposedActions": [');
    assert.equal(out.reply, "");
    assert.deepEqual(out.proposedActions, []);
  });

  it("keeps prose but drops a broken JSON tail after it", () => {
    const out = extractClinicChatPayload('Sure — here it is. {"reply": "x", "suggested');
    assert.equal(out.reply, "Sure — here it is.");
  });

  it("drops an unclosed fence instead of echoing it", () => {
    const out = extractClinicChatPayload('Checking.\n```json\n{"reply": "cut off');
    assert.equal(out.reply, "Checking.");
  });

  it("still shows plain prose when the model ignores the JSON format", () => {
    const out = extractClinicChatPayload("There are no open slots tomorrow.");
    assert.equal(out.reply, "There are no open slots tomorrow.");
  });
});
