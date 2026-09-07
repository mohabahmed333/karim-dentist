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
  });
});
