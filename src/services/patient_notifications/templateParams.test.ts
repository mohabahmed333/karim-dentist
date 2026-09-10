import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  buildConfirmationTemplate,
  buildReminderTemplate,
  sanitizeTemplateParam,
} from "./templateParams.ts";

// Meta rejects a template parameter containing a newline, a tab, or four or more
// consecutive spaces. A patient name pasted from a form is the likely source.
describe("sanitizeTemplateParam", () => {
  it("collapses newlines and tabs into single spaces", () => {
    assert.equal(sanitizeTemplateParam("Ahmed\nMahmoud\tAli"), "Ahmed Mahmoud Ali");
  });

  it("collapses four-or-more spaces, which Meta rejects", () => {
    assert.equal(sanitizeTemplateParam("Root     Canal"), "Root Canal");
  });

  it("trims", () => {
    assert.equal(sanitizeTemplateParam("  Ahmed  "), "Ahmed");
  });

  it("substitutes a dash for an empty value, never an empty parameter", () => {
    // Meta rejects a template send whose parameter is the empty string.
    assert.equal(sanitizeTemplateParam(""), "-");
    assert.equal(sanitizeTemplateParam("   \n "), "-");
  });

  it("truncates rather than letting Meta reject the whole send", () => {
    const out = sanitizeTemplateParam("x".repeat(2000));
    assert.ok(out.length <= 300, `expected truncation, got ${out.length}`);
  });
});

describe("buildConfirmationTemplate", () => {
  const input = {
    patientName: "Ahmed",
    clinicName: "The Dental Lounge",
    startsAt: "2026-07-15T07:00:00Z",
    serviceLabel: "Cleaning",
    language: "en" as const,
  };

  it("maps the four params in the order the approved body reads", () => {
    // "Hi {{1}}, your appointment at {{2}} is confirmed for {{3}}. Service: {{4}}."
    const tpl = buildConfirmationTemplate(input);
    assert.equal(tpl.body?.length, 4);
    assert.equal(tpl.body?.[0].text, "Ahmed");
    assert.equal(tpl.body?.[1].text, "The Dental Lounge");
    assert.match(tpl.body?.[2].text ?? "", /15 July 2026/);
    assert.equal(tpl.body?.[3].text, "Cleaning");
  });

  it("selects the Arabic-bodied template for an Arabic patient", () => {
    assert.equal(buildConfirmationTemplate({ ...input, language: "ar" }).name, "appoinment_ar");
    assert.equal(tplName(buildConfirmationTemplate(input)), "appoinment_en");
  });

  it("sends positionally — a parameterName would be rejected as a format mismatch", () => {
    const tpl = buildConfirmationTemplate(input);
    for (const p of tpl.body ?? []) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(p, "parameterName"),
        false,
        "these templates use {{1}}, so no parameterName may be sent",
      );
      assert.equal(p.type, "text");
    }
  });

  it("sends no header — none of the approved templates has one", () => {
    assert.equal(buildConfirmationTemplate(input).header, undefined);
  });

  it("uses en_US regardless of body language", () => {
    assert.equal(buildConfirmationTemplate({ ...input, language: "ar" }).language, "en_US");
  });

  it("sanitizes every parameter it is given", () => {
    const tpl = buildConfirmationTemplate({ ...input, serviceLabel: "Root\n\nCanal" });
    assert.equal(tpl.body?.[3].text, "Root Canal");
  });
});

describe("buildReminderTemplate", () => {
  const input = {
    patientName: "Ahmed",
    clinicName: "The Dental Lounge",
    startsAt: "2026-07-15T07:00:00Z",
    language: "en" as const,
  };

  it("maps three params, with {{3}} as the time alone", () => {
    // "Reminder: {{1}}, you have an appointment at {{2}} tomorrow at {{3}}."
    const tpl = buildReminderTemplate(input);
    assert.equal(tpl.body?.length, 3);
    assert.equal(tpl.body?.[0].text, "Ahmed");
    assert.equal(tpl.body?.[1].text, "The Dental Lounge");
    assert.match(tpl.body?.[2].text ?? "", /10:00/);
    assert.doesNotMatch(
      tpl.body?.[2].text ?? "",
      /July/,
      "the approved body already says 'tomorrow' — a date here reads as nonsense",
    );
  });

  it("picks the swapped template names", () => {
    assert.equal(buildReminderTemplate({ ...input, language: "ar" }).name, "reminder_en");
    assert.equal(buildReminderTemplate(input).name, "reminder_ar");
  });
});

function tplName(t: { name: string }): string {
  return t.name;
}
