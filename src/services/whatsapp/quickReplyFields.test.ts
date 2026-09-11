import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { findUnfilledFields, findUnknownFields, renderQuickReply } from "./quickReplyFields.ts";

describe("renderQuickReply", () => {
  it("fills every known field that has a value", () => {
    const out = renderQuickReply("Hi {{name}}, see you {{next_appointment}}.", {
      name: "Mona",
      next_appointment: "Tuesday 10:00",
    });
    assert.equal(out.text, "Hi Mona, see you Tuesday 10:00.");
    assert.deepEqual(out.missing, []);
  });

  it("leaves a field with no value in place and reports it", () => {
    // A half-filled message must stay visibly unfinished, never silently blank.
    const out = renderQuickReply("Hi {{name}}, see you {{next_appointment}}.", { name: "Mona" });
    assert.equal(out.text, "Hi Mona, see you {{next_appointment}}.");
    assert.deepEqual(out.missing, ["next_appointment"]);
  });

  it("treats a blank value as missing", () => {
    assert.deepEqual(renderQuickReply("{{name}}", { name: "   " }).missing, ["name"]);
  });

  it("tolerates spaces inside the braces", () => {
    assert.equal(renderQuickReply("Hi {{ name }}", { name: "Mona" }).text, "Hi Mona");
  });

  it("leaves unknown braces untouched and does not report them", () => {
    const out = renderQuickReply("Use {{coupon}}", {});
    assert.equal(out.text, "Use {{coupon}}");
    assert.deepEqual(out.missing, []);
  });

  it("reports a repeated missing field once", () => {
    assert.deepEqual(renderQuickReply("{{name}} {{name}}", {}).missing, ["name"]);
  });
});

describe("findUnfilledFields", () => {
  it("finds known fields still in the text, including ones staff typed", () => {
    assert.deepEqual(findUnfilledFields("Hi {{name}}, {{ clinic_hours }} {{coupon}}"), [
      "name",
      "clinic_hours",
    ]);
  });

  it("returns nothing for plain text", () => {
    assert.deepEqual(findUnfilledFields("Hi Mona, see you Tuesday."), []);
  });
});

describe("findUnknownFields", () => {
  it("names the fields the composer could never fill", () => {
    assert.deepEqual(findUnknownFields("Hi {{nmae}} at {{clinic_address}}"), ["nmae"]);
  });
});
