import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { proposalTotal, attachPatientInfo } from "./queries";

describe("proposalTotal", () => {
  it("sums every item's amount", () => {
    const total = proposalTotal([
      { id: "1", serviceId: "s1", description: "Root canal", amountEgp: 1500 },
      { id: "2", serviceId: "s2", description: "Crown", amountEgp: 2000 },
    ]);
    assert.equal(total, 3500);
  });

  it("returns zero for no items", () => {
    assert.equal(proposalTotal([]), 0);
  });
});

describe("attachPatientInfo", () => {
  it("looks up each proposal's patient by patient_key", () => {
    const proposals = [
      {
        id: "p1",
        patientKey: "pk1",
        doctorId: "d1",
        status: "sent" as const,
        createdAt: "t",
        items: [],
        total: 0,
        reservationId: null,
      },
    ];
    const directory = [{ patientKey: "pk1", displayName: "Sara", phone: "0100", visits: [] }];
    const result = attachPatientInfo(proposals, directory as never);
    assert.equal(result[0].displayName, "Sara");
    assert.equal(result[0].phone, "0100");
  });

  it("falls back to the bare key when no directory entry matches", () => {
    const proposals = [
      {
        id: "p1",
        patientKey: "pk-unknown",
        doctorId: "d1",
        status: "sent" as const,
        createdAt: "t",
        items: [],
        total: 0,
        reservationId: null,
      },
    ];
    const result = attachPatientInfo(proposals, []);
    assert.equal(result[0].displayName, "pk-unknown");
    assert.equal(result[0].phone, "");
  });
});
