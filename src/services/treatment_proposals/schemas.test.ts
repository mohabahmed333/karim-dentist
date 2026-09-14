import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createProposalSchema } from "./schemas";

describe("createProposalSchema", () => {
  it("accepts a doctor with one service", () => {
    const parsed = createProposalSchema.parse({
      doctorId: "11111111-1111-4111-8111-111111111111",
      items: [{ serviceId: "22222222-2222-4222-8222-222222222222", description: "Root canal", amountEgp: 1500 }],
    });
    assert.equal(parsed.items.length, 1);
  });

  it("accepts multiple services", () => {
    const parsed = createProposalSchema.parse({
      doctorId: "11111111-1111-4111-8111-111111111111",
      items: [
        { serviceId: "22222222-2222-4222-8222-222222222222", description: "Root canal", amountEgp: 1500 },
        { serviceId: "33333333-3333-4333-8333-333333333333", description: "Crown", amountEgp: 2000 },
      ],
    });
    assert.equal(parsed.items.length, 2);
  });

  it("rejects an empty items list", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "11111111-1111-4111-8111-111111111111",
        items: [],
      }),
    );
  });

  it("rejects a non-positive amount", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "11111111-1111-4111-8111-111111111111",
        items: [{ serviceId: "22222222-2222-4222-8222-222222222222", description: "Root canal", amountEgp: 0 }],
      }),
    );
  });

  it("rejects an empty description", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "11111111-1111-4111-8111-111111111111",
        items: [{ serviceId: "22222222-2222-4222-8222-222222222222", description: "  ", amountEgp: 500 }],
      }),
    );
  });

  it("rejects a non-uuid doctorId", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "not-a-uuid",
        items: [{ serviceId: "22222222-2222-4222-8222-222222222222", description: "Root canal", amountEgp: 500 }],
      }),
    );
  });

  it("accepts a reservation id, tying the proposal to a visit", () => {
    const parsed = createProposalSchema.parse({
      doctorId: "11111111-1111-4111-8111-111111111111",
      items: [{ serviceId: "22222222-2222-4222-8222-222222222222", description: "Root canal", amountEgp: 1500 }],
      reservationId: "44444444-4444-4444-8444-444444444444",
    });
    assert.equal(parsed.reservationId, "44444444-4444-4444-8444-444444444444");
  });

  it("leaves reservationId absent when no visit is picked — not every proposal has to belong to one", () => {
    const parsed = createProposalSchema.parse({
      doctorId: "11111111-1111-4111-8111-111111111111",
      items: [{ serviceId: "22222222-2222-4222-8222-222222222222", description: "Root canal", amountEgp: 1500 }],
    });
    assert.equal(parsed.reservationId, undefined);
  });

  it("rejects a non-uuid reservationId", () => {
    assert.throws(() =>
      createProposalSchema.parse({
        doctorId: "11111111-1111-4111-8111-111111111111",
        items: [{ serviceId: "22222222-2222-4222-8222-222222222222", description: "Root canal", amountEgp: 1500 }],
        reservationId: "not-a-uuid",
      }),
    );
  });
});
