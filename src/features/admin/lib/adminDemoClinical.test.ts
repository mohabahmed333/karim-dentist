import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { demoClinicalForPatient } from "./adminDemoClinical.ts";
import type { AdminDemoClinical } from "./adminDemoClinical.ts";

const demo: AdminDemoClinical = {
  patientKey: "phone:201111000003",
  imaging: [
    {
      id: "img-1",
      patient_key: "phone:201111000003",
      title: "PA #16",
      kind: "xray",
      tooth_number: 16,
      tooth_fdi: "16",
      file_url: "https://example.com/x.jpg",
      file_name: "x.jpg",
      mime_type: "image/jpeg",
      taken_at: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  notes: [
    {
      id: "note-1",
      patient_key: "phone:201111000003",
      fdi_number: "16",
      body: "Pain on biting",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      patient_tooth_note_attachments: [],
    },
  ],
  treatments: [],
};

describe("demoClinicalForPatient", () => {
  it("returns imaging and notes for the matching schedule patient", () => {
    const hit = demoClinicalForPatient(demo, "phone:201111000003");
    assert.ok(hit);
    assert.equal(hit.imaging.length, 1);
    assert.equal(hit.notes[0]?.body, "Pain on biting");
  });

  it("returns null for a different schedule patient", () => {
    assert.equal(demoClinicalForPatient(demo, "phone:201111000008"), null);
  });
});
