import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { pickPatientLanguage } from "./pickLanguage.ts";

// Nothing in the schema records a patient's language, so it is inferred. What
// the patient last wrote beats what their name looks like: plenty of Egyptian
// patients have Arabic-script names and message in English.
describe("pickPatientLanguage", () => {
  it("follows Arabic script in the patient's last message", () => {
    assert.equal(
      pickPatientLanguage({ lastInboundBody: "عايز أحجز ميعاد", patientName: "Ahmed" }),
      "ar",
    );
  });

  it("follows Latin script in the patient's last message", () => {
    assert.equal(
      pickPatientLanguage({ lastInboundBody: "can I book tomorrow?", patientName: "أحمد" }),
      "en",
    );
  });

  it("falls back to the name's script when the patient has never written", () => {
    assert.equal(pickPatientLanguage({ patientName: "أحمد محمود" }), "ar");
    assert.equal(pickPatientLanguage({ patientName: "Ahmed Mahmoud" }), "en");
  });

  it("defaults to Arabic for a Cairo clinic when nothing is known", () => {
    assert.equal(pickPatientLanguage({ patientName: "" }), "ar");
    assert.equal(pickPatientLanguage({ patientName: "   ", lastInboundBody: "   " }), "ar");
  });

  it("honours an explicit fallback", () => {
    assert.equal(pickPatientLanguage({ patientName: "", fallback: "en" }), "en");
  });

  it("ignores digits and punctuation when deciding script", () => {
    // A bare "0100 555 1234" says nothing about language.
    assert.equal(pickPatientLanguage({ lastInboundBody: "0100 555 1234", patientName: "أحمد" }), "ar");
  });
});
