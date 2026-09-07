import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { conversationToAssistPatient } from "./clinicAssistChat.ts";

describe("conversationToAssistPatient", () => {
  it("prefers matched patientKey and profile href", () => {
    const patient = conversationToAssistPatient({
      id: "wa-1",
      name: "Sara Ali",
      initials: "SA",
      avatarColor: "#fff",
      preview: "hi",
      timestamp: "",
      tags: [],
      phone: "+20100",
      patientKey: "sara-key",
      profileHref: "/admin/patients/sara-key",
    });
    assert.equal(patient.patientKey, "sara-key");
    assert.equal(patient.name, "Sara Ali");
    assert.equal(patient.phone, "+20100");
    assert.equal(patient.href, "/admin/patients/sara-key");
  });

  it("falls back to wa:phone when unmatched", () => {
    const patient = conversationToAssistPatient({
      id: "wa-2",
      name: "Guest",
      initials: "G",
      avatarColor: "#fff",
      preview: "hi",
      timestamp: "",
      tags: [],
      phone: "0100",
    });
    assert.equal(patient.patientKey, "wa:0100");
  });
});
