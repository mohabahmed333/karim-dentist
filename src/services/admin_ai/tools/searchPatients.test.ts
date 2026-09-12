import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "../testing/fakeDb.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { searchPatients, searchPatientsArgs } from "./searchPatients.ts";

const ALI = {
  id: "r1",
  patient_name: "Ali Hassan",
  phone: "+201001234567",
  email: null,
  service_label: "Cleaning",
  starts_at: "2026-08-01T10:00:00.000Z",
  status: "completed",
  deleted_at: null,
};
const ALI_UPCOMING = {
  ...ALI,
  id: "r2",
  starts_at: "2026-09-20T10:00:00.000Z",
  status: "confirmed",
};
const MONA = {
  id: "r3",
  patient_name: "Mona Adel",
  phone: "+201009876543",
  email: null,
  service_label: "Whitening",
  starts_at: "2026-08-05T10:00:00.000Z",
  status: "completed",
  deleted_at: null,
};
const NOW = new Date("2026-09-12T00:00:00.000Z");

describe("searchPatients", () => {
  it("matches by name, case-insensitively", async () => {
    const db = createFakeDb({ tables: { reservations: [ALI, ALI_UPCOMING, MONA] } });
    const out = await searchPatients(db as never, searchPatientsArgs.parse({ query: "ali" }), NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.name, "Ali Hassan");
    assert.equal(out[0]?.phone, "+201001234567");
  });

  it("matches by phone digits", async () => {
    const db = createFakeDb({ tables: { reservations: [ALI, MONA] } });
    const out = await searchPatients(db as never, searchPatientsArgs.parse({ query: "0100987" }), NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.name, "Mona Adel");
  });

  it("reports visit count and next/last visit from the whole history", async () => {
    const db = createFakeDb({ tables: { reservations: [ALI, ALI_UPCOMING] } });
    const out = await searchPatients(db as never, searchPatientsArgs.parse({ query: "Ali" }), NOW);
    assert.equal(out[0]?.visitCount, 2);
    assert.equal(out[0]?.nextVisit?.reservationId, "r2");
    assert.equal(out[0]?.lastVisit?.starts_at, ALI.starts_at);
  });

  it("returns nothing for a query matching no one", async () => {
    const db = createFakeDb({ tables: { reservations: [ALI, MONA] } });
    const out = await searchPatients(db as never, searchPatientsArgs.parse({ query: "Zzz" }), NOW);
    assert.deepEqual(out, []);
  });

  it("leaves out soft-deleted reservations", async () => {
    const db = createFakeDb({ tables: { reservations: [{ ...ALI, deleted_at: "2026-01-01" }] } });
    const out = await searchPatients(db as never, searchPatientsArgs.parse({ query: "Ali" }), NOW);
    assert.deepEqual(out, []);
  });
});
