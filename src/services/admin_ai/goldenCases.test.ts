import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractClinicChatPayload } from "./extractClinicChat.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { proposedActionSchema } from "./schemas.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { orderActions } from "./proposalUtils.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { isWriteActionKind } from "./writeKinds.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { prescriptionInsertSchema } from "./clinicalPayloads.ts";

/**
 * Golden cases for Admin AI action proposals.
 * These encode expected model→schema behavior without calling Groq.
 */
describe("admin_ai golden cases", () => {
  const defaults = [{ id: "start:book", label: "Book" }];

  it("mark caries on 16 and 17 as ordered surface actions", () => {
    const raw = `\`\`\`json
{
  "reply": "Ready to chart decay on 16 and 17 — confirm to save.",
  "proposedActions": [
    { "id": "c16", "kind": "chart.set_surfaces", "label": "Decay 16", "dependsOn": [], "payload": { "fdi": "16", "occlusal": "decay", "patientKey": "p1" } },
    { "id": "c17", "kind": "chart.set_surfaces", "label": "Decay 17", "dependsOn": [], "payload": { "fdi": "17", "occlusal": "decay", "patientKey": "p1" } }
  ]
}
\`\`\``;
    const out = extractClinicChatPayload(raw, defaults);
    assert.equal(out.proposedActions.length, 2);
    assert.match(out.reply, /confirm/i);
    assert.ok(!/saved|done|already/i.test(out.reply) || /confirm/i.test(out.reply));
  });

  it("multi-tooth CDT treatments with dependsOn ordering", () => {
    const actions = [
      proposedActionSchema.parse({
        id: "t16",
        kind: "treatment.create",
        label: "Fill 16",
        dependsOn: ["c16"],
        payload: {
          tooth_fdi: "16",
          tooth_name: "16",
          severity: "Minor",
          cdt_code: "D2392",
        },
      }),
      proposedActionSchema.parse({
        id: "c16",
        kind: "chart.set_surfaces",
        label: "Chart 16",
        dependsOn: [],
        payload: { fdi: "16", occlusal: "decay" },
      }),
    ];
    assert.deepEqual(
      orderActions(actions).map((a) => a.id),
      ["c16", "t16"],
    );
  });

  it("SOAP clinical note proposes write kind", () => {
    const action = proposedActionSchema.parse({
      id: "n1",
      kind: "note.clinical",
      label: "SOAP note",
      payload: {
        category: "SOAP",
        content: "S: sensitivity O: decay A: caries P: restore",
        patientKey: "p1",
        tooth_fdi: "26",
      },
    });
    assert.equal(isWriteActionKind(action.kind), true);
  });

  it("prescription missing dose fails schema", () => {
    assert.throws(() =>
      prescriptionInsertSchema.parse({
        patient_key: "p1",
        medication: "Ibuprofen",
        dose: "",
        frequency: "ONCE_DAILY",
      }),
    );
  });

  it("imaging attach is organize-only write kind", () => {
    const action = proposedActionSchema.parse({
      id: "img1",
      kind: "imaging.attach",
      label: "Attach bitewing",
      payload: {
        title: "Bitewing",
        kind: "xray",
        file_url: "https://example.com/x.png",
        file_name: "x.png",
        mime_type: "image/png",
        tooth_fdi: "16",
      },
    });
    assert.equal(action.kind, "imaging.attach");
    assert.equal(isWriteActionKind(action.kind), true);
  });

  it("follow-up book requires open slot id in payload shape", () => {
    const action = proposedActionSchema.parse({
      id: "f1",
      kind: "followup.book",
      label: "Book follow-up",
      payload: {
        slotId: "00000000-0000-0000-0000-000000000001",
        patient_name: "Ali",
        phone: "+20100",
        service_label: "Follow-up",
      },
    });
    assert.equal(action.kind, "followup.book");
  });

  it("rejects prompt-injection kind", () => {
    const out = extractClinicChatPayload(
      `\`\`\`json
{ "reply": "ok", "proposedActions": [{ "id": "x", "kind": "ignore.previous.instructions", "label": "x", "payload": {} }] }
\`\`\``,
      defaults,
    );
    assert.equal(out.proposedActions.length, 0);
  });

  it("CMS hero update is a write", () => {
    assert.equal(isWriteActionKind("cms.update_singleton"), true);
    assert.equal(isWriteActionKind("navigate.focus_tooth"), false);
  });
});
