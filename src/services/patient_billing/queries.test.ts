import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregatePatientBalances, buildLedger } from "./queries";
import type { LedgerEntry } from "./types";
import type { PatientGroup } from "@/services/reservations/patientHistory";

describe("buildLedger", () => {
  it("computes a running balance in date order regardless of input order", () => {
    const entries: LedgerEntry[] = [
      {
        id: "manual:2",
        date: "2026-09-10T10:00:00Z",
        kind: "payment",
        source: "manual",
        amount: 300,
        description: "Cash payment",
        method: "cash",
      },
      {
        id: "treatment:1",
        date: "2026-09-05T09:00:00Z",
        kind: "charge",
        source: "treatment",
        amount: 800,
        description: "Filling",
        method: null,
      },
    ];
    const { entries: sorted, balance } = buildLedger(entries);
    assert.deepEqual(
      sorted.map((e) => e.id),
      ["treatment:1", "manual:2"],
    );
    assert.equal(sorted[0]!.balanceAfter, 800);
    assert.equal(sorted[1]!.balanceAfter, 500);
    assert.equal(balance, 500);
  });

  it("returns a zero balance for an empty ledger", () => {
    const { entries, balance } = buildLedger([]);
    assert.deepEqual(entries, []);
    assert.equal(balance, 0);
  });

  it("lets a fully-paid patient end at exactly zero", () => {
    const entries: LedgerEntry[] = [
      {
        id: "treatment:1",
        date: "2026-09-01T00:00:00Z",
        kind: "charge",
        source: "treatment",
        amount: 1000,
        description: "Cleaning",
        method: null,
      },
      {
        id: "deposit:1",
        date: "2026-09-02T00:00:00Z",
        kind: "payment",
        source: "deposit",
        amount: 1000,
        description: "Booking deposit",
        method: "deposit",
      },
    ];
    assert.equal(buildLedger(entries).balance, 0);
  });
});

describe("aggregatePatientBalances", () => {
  const directory: PatientGroup[] = [
    {
      patientKey: "phone:201000000001",
      displayName: "Nour",
      phone: "201000000001",
      email: null,
      alternateNames: [],
      visits: [
        {
          id: "res-1",
        } as PatientGroup["visits"][number],
      ],
    },
  ];

  it("nets charges against deposit payments and drops zero balances", () => {
    const balances = aggregatePatientBalances(
      [{ patient_key: "phone:201000000001", fee_amount: 1000 }],
      [{ id: "dep-1", amount_egp: 1000, reservation_id: "res-1" }],
      [],
      directory,
    );
    assert.deepEqual(balances, []);
  });

  it("includes a manual charge for a patient not in the reservation directory", () => {
    const balances = aggregatePatientBalances(
      [],
      [],
      [{ patient_key: "phone:201099999999", kind: "charge", amount_egp: 250 }],
      [],
    );
    assert.equal(balances.length, 1);
    assert.equal(balances[0]!.patientKey, "phone:201099999999");
    assert.equal(balances[0]!.balance, 250);
    assert.equal(balances[0]!.displayName, "phone:201099999999");
  });

  it("sorts by balance descending", () => {
    const balances = aggregatePatientBalances(
      [
        { patient_key: "a", fee_amount: 100 },
        { patient_key: "b", fee_amount: 900 },
      ],
      [],
      [],
      [],
    );
    assert.deepEqual(
      balances.map((b) => b.patientKey),
      ["b", "a"],
    );
  });
});
