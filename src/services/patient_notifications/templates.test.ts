import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  PATIENT_TEMPLATES,
  WHATSAPP_TEMPLATE_LANGUAGE,
  templateFor,
} from "./templates.ts";

describe("patient templates — what Meta actually approved", () => {
  // If this test fails, someone has "corrected" the mapping. Read the comment
  // in templates.ts before changing anything: the approved body of `reminder_en`
  // is ARABIC and the body of `reminder_ar` is ENGLISH. Aligning the names with
  // the languages sends every patient the wrong language.
  it("reminder template names are swapped in Meta — do not 'fix' this", () => {
    assert.equal(templateFor("reminder_24h", "ar").name, "reminder_en");
    assert.equal(templateFor("reminder_24h", "en").name, "reminder_ar");
  });

  it("keeps the 'appoinment' typo, because template names are immutable", () => {
    assert.equal(templateFor("confirmation", "en").name, "appoinment_en");
    assert.equal(templateFor("confirmation", "ar").name, "appoinment_ar");
  });

  it("sends every template as en_US, whatever the body language", () => {
    assert.equal(WHATSAPP_TEMPLATE_LANGUAGE, "en_US");
    for (const tpl of PATIENT_TEMPLATES) {
      assert.equal(
        tpl.language,
        "en_US",
        `${tpl.name} must be sent as en_US — that is how it is registered`,
      );
    }
  });

  it("records the parameter count of each approved body", () => {
    assert.equal(templateFor("confirmation", "en").bodyParams, 4);
    assert.equal(templateFor("confirmation", "ar").bodyParams, 4);
    assert.equal(templateFor("reminder_24h", "en").bodyParams, 3);
    assert.equal(templateFor("reminder_24h", "ar").bodyParams, 3);
  });

  it("covers every kind in both languages exactly once", () => {
    const seen = new Set(
      PATIENT_TEMPLATES.map((t: { kind: string; bodyLanguage: string }) =>
        `${t.kind}:${t.bodyLanguage}`,
      ),
    );
    assert.equal(seen.size, PATIENT_TEMPLATES.length, "duplicate kind+language");
    assert.equal(PATIENT_TEMPLATES.length, 4);
  });

  it("throws rather than guessing when a template is missing", () => {
    assert.throws(
      () => templateFor("recall_6m", "ar"),
      /no approved template/i,
      "an unmapped kind must fail loudly, never fall back to another template",
    );
  });
});
