import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { knowledgeDraftFrom } from "./corrections.ts";

describe("knowledgeDraftFrom", () => {
  it("never publishes a promoted correction on its own", () => {
    // Right for one patient in one conversation is not automatically a fact to
    // quote to everyone. A person publishes it from the knowledge editor.
    assert.equal(
      knowledgeDraftFrom({ sent_text: "A filling is 900 EGP.", intent: "pricing" }).is_published,
      false,
    );
  });

  it("files an English answer under the English body", () => {
    const draft = knowledgeDraftFrom({ sent_text: "  A filling is 900 EGP. ", intent: "pricing" });
    assert.equal(draft.body, "A filling is 900 EGP.");
    assert.equal(draft.body_ar, "");
  });

  it("files an Arabic answer under the Arabic body", () => {
    const draft = knowledgeDraftFrom({ sent_text: "الحشو بـ ٩٠٠ جنيه.", intent: "pricing" });
    assert.equal(draft.body_ar, "الحشو بـ ٩٠٠ جنيه.");
    assert.equal(draft.body, "");
  });

  it("titles it from the intent so staff can find it, and tags its origin", () => {
    const draft = knowledgeDraftFrom({ sent_text: "x", intent: "booking_availability" });
    assert.equal(draft.title, "booking availability");
    assert.deepEqual(draft.tags, ["from-correction"]);
  });

  it("still produces a usable title with no intent recorded", () => {
    assert.equal(knowledgeDraftFrom({ sent_text: "x", intent: null }).title, "Staff answer");
  });
});
