import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STRUGGLE_THRESHOLD,
  handoffAck,
  withDisclosure,
  withHumanOffer,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./disclosure.ts";

describe("withDisclosure", () => {
  it("tells the patient on the first reply that this is an assistant, in Arabic", () => {
    const out = withDisclosure("العيادة مفتوحة الأحد", "ar", true);
    assert.match(out, /المساعد الآلي/);
    assert.match(out, /«موظف»/);
    assert.ok(out.endsWith("العيادة مفتوحة الأحد"));
  });

  it("does the same in English", () => {
    const out = withDisclosure("We open at 10.", "en", true);
    assert.match(out, /automated assistant/);
    assert.match(out, /“human”/);
  });

  it("leaves later replies alone", () => {
    assert.equal(withDisclosure("We open at 10.", "en", false), "We open at 10.");
  });

  it("falls back to English for an unknown language", () => {
    assert.match(withDisclosure("hi", undefined, true), /automated assistant/);
  });
});

describe("withHumanOffer", () => {
  it("does not offer a person after a single rough turn", () => {
    assert.equal(withHumanOffer("Which service?", "en", STRUGGLE_THRESHOLD - 1), "Which service?");
  });

  it("offers a person once the patient has struggled repeatedly", () => {
    const out = withHumanOffer("أي خدمة تحب؟", "ar", STRUGGLE_THRESHOLD);
    assert.match(out, /أحوّلك لأحد الزملاء/);
  });

  it("never repeats the offer", () => {
    const once = withHumanOffer("Which service?", "en", 3);
    assert.equal(withHumanOffer(once, "en", 4), once);
  });
});

describe("handoffAck", () => {
  it("confirms the handoff in the patient's language", () => {
    assert.match(handoffAck("ar"), /حوّلتك/);
    assert.match(handoffAck("en"), /colleague/);
  });
});
