import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "./testing/fakeDb.ts";
import {
  encounterCreateAdapter,
  mergeProfile,
  patientUpsertProfileAdapter,
  // @ts-expect-error -- Node strip-types needs the extension.
} from "./patientAdapters.ts";

const existing = {
  patient_key: "phone:201001234567",
  display_name: "Ali Hassan",
  phone: "+201001234567",
  email: null,
  date_of_birth: null,
  age_years: 34,
  gender: "male",
  medical_history: ["Hypertension"],
  allergies: ["Penicillin"],
  medications: "Amlodipine",
  notes: "Anxious about drilling",
};

const ctx = (db: unknown) => ({ db, actorId: "admin-1" });
const act = (kind: string, payload: Record<string, unknown>) => ({
  id: "a1",
  kind,
  label: kind,
  dependsOn: [],
  payload,
});

describe("mergeProfile", () => {
  /**
   * The model only ever sees the slice of the record the conversation is
   * about. Treating its payload as the whole row would silently erase
   * allergies or history it never mentioned — the worst possible failure for
   * a clinical record.
   */
  it("keeps fields the payload does not mention", () => {
    const out = mergeProfile(existing, { notes: "Prefers morning visits" });
    assert.equal(out.notes, "Prefers morning visits");
    assert.deepEqual(out.allergies, ["Penicillin"]);
    assert.deepEqual(out.medical_history, ["Hypertension"]);
    assert.equal(out.medications, "Amlodipine");
    assert.equal(out.age_years, 34);
  });

  it("replaces a list only when the payload supplies one", () => {
    const out = mergeProfile(existing, { allergies: ["Penicillin", "Latex"] });
    assert.deepEqual(out.allergies, ["Penicillin", "Latex"]);
    assert.deepEqual(out.medical_history, ["Hypertension"]);
  });

  it("builds a complete row from nothing when the patient is new", () => {
    const out = mergeProfile(null, { display_name: "New Patient", phone: "+2010" });
    assert.equal(out.display_name, "New Patient");
    assert.deepEqual(out.allergies, []);
    assert.equal(out.gender, "");
  });

  it("requires a display name", () => {
    assert.throws(() => mergeProfile(null, { phone: "+2010" }), /display_name/);
  });

  it("rejects a value the profile schema would not accept", () => {
    assert.throws(() => mergeProfile(existing, { age_years: 900 }));
    assert.throws(() => mergeProfile(existing, { gender: "unknown" }));
  });
});

describe("patient.upsert_profile", () => {
  it("previews the merged result against the stored row", async () => {
    const db = createFakeDb({ tables: { patient_profiles: [existing] } });
    const out = await patientUpsertProfileAdapter.preview(
      act("patient.upsert_profile", {
        patientKey: "phone:201001234567",
        notes: "Updated",
      }),
      ctx(db),
    );
    assert.equal(out.before.notes, "Anxious about drilling");
    assert.equal(out.after.notes, "Updated");
    assert.deepEqual(out.warnings, []);
  });

  it("warns that a new profile will be created", async () => {
    const db = createFakeDb({ tables: { patient_profiles: [] } });
    const out = await patientUpsertProfileAdapter.preview(
      act("patient.upsert_profile", { patientKey: "phone:999", display_name: "Sara" }),
      ctx(db),
    );
    assert.ok(out.warnings?.some((w: string) => /new patient profile/i.test(w)));
  });

  it("upserts on patient_key", async () => {
    const db = createFakeDb({ tables: { patient_profiles: [existing] } });
    await patientUpsertProfileAdapter.execute(
      act("patient.upsert_profile", {
        patientKey: "phone:201001234567",
        notes: "Updated",
      }),
      ctx(db),
    );
    const [row] = db.upsertsTo("patient_profiles");
    assert.equal(row.values.patient_key, "phone:201001234567");
    assert.equal(row.values.notes, "Updated");
    assert.deepEqual(row.values.allergies, ["Penicillin"]);
  });

  it("falls back to the active patient in context", async () => {
    const db = createFakeDb({ tables: { patient_profiles: [existing] } });
    const out = await patientUpsertProfileAdapter.preview(
      act("patient.upsert_profile", { notes: "x" }),
      { db, actorId: "a", patientKey: "phone:201001234567" },
    );
    assert.equal(out.target, "patient:phone:201001234567");
  });

  it("requires a patient key from somewhere", async () => {
    const db = createFakeDb({});
    await assert.rejects(
      () =>
        patientUpsertProfileAdapter.preview(
          act("patient.upsert_profile", { notes: "x" }),
          ctx(db),
        ),
      /patientKey is required/,
    );
  });
});

describe("encounter.create", () => {
  it("records a completed visit against the patient's phone", async () => {
    const db = createFakeDb({});
    await encounterCreateAdapter.execute(
      act("encounter.create", {
        patientKey: "phone:201001234567",
        type: "Cleaning",
        patient_name: "Ali Hassan",
        timestamp: "2026-09-01T10:00:00.000Z",
      }),
      ctx(db),
    );
    const [row] = db.insertsTo("reservations");
    assert.equal(row.values.status, "completed");
    assert.equal(row.values.service_label, "Cleaning");
    assert.equal(row.values.phone, "201001234567");
  });

  it("defaults the timestamp to now", async () => {
    const db = createFakeDb({});
    const out = await encounterCreateAdapter.preview(
      act("encounter.create", { patientKey: "phone:1", type: "Checkup" }),
      ctx(db),
    );
    assert.ok(!Number.isNaN(Date.parse(String(out.after.timestamp))));
  });

  it("warns on a future-dated encounter", async () => {
    const db = createFakeDb({});
    const out = await encounterCreateAdapter.preview(
      act("encounter.create", {
        patientKey: "phone:1",
        type: "Checkup",
        timestamp: new Date(Date.now() + 86_400_000).toISOString(),
      }),
      ctx(db),
    );
    assert.ok(out.warnings?.some((w: string) => /future/i.test(w)));
  });

  it("rejects a missing type or an unparseable date", async () => {
    const db = createFakeDb({});
    await assert.rejects(
      () =>
        encounterCreateAdapter.preview(
          act("encounter.create", { patientKey: "phone:1", type: " " }),
          ctx(db),
        ),
      /type is required/i,
    );
    await assert.rejects(
      () =>
        encounterCreateAdapter.preview(
          act("encounter.create", {
            patientKey: "phone:1",
            type: "Checkup",
            timestamp: "not-a-date",
          }),
          ctx(db),
        ),
      /valid date/i,
    );
  });
});
