import type { PatientImaging } from "@/services/patient_imaging";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import type { PatientTreatmentRow } from "@/services/patient_treatments/types";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { CLINICAL_AI_FIXTURE } from "./fixtures/patientClinicalFixtures";
import { buildShowreelReservations } from "./buildShowreelReservations";

const NOW = new Date().toISOString();
const KEY = "phone:201111000003";
const PHONE = "+201111000003";

function nourVisits(): Reservation[] {
  return buildShowreelReservations().filter(
    (r) => r.phone === PHONE && !r.deleted_at,
  );
}

export function buildShowreelClinicalGroup(): PatientGroup {
  const visits = nourVisits();
  return {
    patientKey: KEY,
    displayName: CLINICAL_AI_FIXTURE.patientName,
    phone: PHONE,
    email: null,
    alternateNames: [],
    visits,
  };
}

export function buildShowreelClinicalImaging(): PatientImaging[] {
  const fx = CLINICAL_AI_FIXTURE;
  return [
    {
      id: "c1111111-1111-4111-8111-111111111201",
      patient_key: KEY,
      title: "Periapical #16",
      kind: "xray",
      tooth_number: 16,
      tooth_fdi: fx.toothFdi,
      file_url: fx.xrayUrl,
      file_name: "pa-16.jpg",
      mime_type: "image/jpeg",
      taken_at: NOW,
      created_at: NOW,
      updated_at: NOW,
    },
    {
      id: "c1111111-1111-4111-8111-111111111202",
      patient_key: KEY,
      title: "CBCT volume · UR quadrant",
      kind: "cbct",
      tooth_number: 16,
      tooth_fdi: fx.toothFdi,
      file_url: "/dental/772401978_18085208630253727_984276698240454703_n.jpg",
      file_name: "cbct-ur.jpg",
      mime_type: "image/jpeg",
      taken_at: NOW,
      created_at: NOW,
      updated_at: NOW,
    },
  ];
}

export function buildShowreelClinicalNotes(): PatientToothNote[] {
  return CLINICAL_AI_FIXTURE.notes.map((body, i) => ({
    id: `c1111111-1111-4111-8111-11111111130${i}`,
    patient_key: KEY,
    fdi_number: CLINICAL_AI_FIXTURE.toothFdi,
    body,
    created_at: NOW,
    updated_at: NOW,
    patient_tooth_note_attachments: [],
  }));
}

export function buildShowreelClinicalTreatments(): PatientTreatmentRow[] {
  const fx = CLINICAL_AI_FIXTURE;
  const tx = fx.caseSummary.proposedTreatment;
  return [
    {
      id: "c1111111-1111-4111-8111-111111111401",
      patient_key: KEY,
      tooth_name: fx.toothName,
      tooth_fdi: fx.toothFdi,
      severity: "Critical",
      last_treatment: "<p>Cold test lingering; PA taken.</p>",
      ai_title: tx.title,
      ai_description: `<p>${fx.caseSummary.findings.join("</p><p>")}</p>`,
      ai_confidence: 88,
      ai_recommendation: `<p>${tx.cdtHint} · ${tx.feeHint}</p>`,
      status: "open",
      reservation_id: "res-nour",
      cdt_code: "D2391",
      phase: "urgent",
      fee_amount: 3200,
      created_at: NOW,
      updated_at: NOW,
      patient_treatment_attachments: [
        {
          id: "c1111111-1111-4111-8111-111111111501",
          treatment_id: "c1111111-1111-4111-8111-111111111401",
          kind: "xray",
          file_url: fx.xrayUrl,
          file_name: "pa-16.jpg",
          mime_type: "image/jpeg",
          imaging_id: "c1111111-1111-4111-8111-111111111201",
          created_at: NOW,
        },
      ],
    },
    {
      id: "c1111111-1111-4111-8111-111111111402",
      patient_key: KEY,
      tooth_name: fx.toothName,
      tooth_fdi: fx.toothFdi,
      severity: "Minor",
      last_treatment: "<p>Occlusal adjustment deferred.</p>",
      ai_title: "Occlusal review after excavation",
      ai_description: "<p>Check high contacts once provisional is placed.</p>",
      ai_confidence: 72,
      ai_recommendation: "<p>Reassess at follow-up visit.</p>",
      status: "scheduled",
      reservation_id: "res-nour-xray",
      cdt_code: "D9951",
      phase: "restorative",
      fee_amount: 600,
      created_at: NOW,
      updated_at: NOW,
      patient_treatment_attachments: [],
    },
  ];
}

/** Empty catalog — workspace AI chat does not require live services. */
export function buildShowreelClinicalServices(): Service[] {
  return [];
}
