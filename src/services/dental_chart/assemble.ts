import { withToothAlerts } from "./alerts";
import { emptyArchNumbers, archForUniversal, fdiForUniversal } from "./numbering";
import {
  seedConditions,
  seedEncounters,
  seedLabs,
  seedMedia,
  seedPrescriptions,
} from "./seed";
import type { DentalChart, Encounter, PatientProfile, ToothData } from "./types";
import type { Reservation } from "@/services/reservations/types";
import { anchorForEncounter } from "./anchors";
import type { EncounterType } from "./enums";

export function buildPatientProfile(
  patientKey: string,
  name: string,
): PatientProfile {
  return {
    id: patientKey,
    name,
    dob: null,
    assignedProviderIds: ["dr-karim", "nour-h", "yara-m", "omar-s"],
  };
}

function emptyTeeth(): ToothData[] {
  return emptyArchNumbers().map((toothNumber) => ({
    toothNumber,
    fdi: fdiForUniversal(toothNumber),
    arch: archForUniversal(toothNumber),
    conditions: [],
    activeAlertCount: 0,
    glowing: false,
  }));
}

export function inferEncounterType(label: string): EncounterType {
  const value = label.toLowerCase();
  if (value.includes("cbct") || value.includes("x-ray")) return "CBCT_SCAN";
  if (value.includes("perio")) return "PERIO_PROBING";
  if (value.includes("pulp") || value.includes("endo") || value.includes("rct")) {
    return "PULPECTOMY";
  }
  return "CROWN_PREP";
}

export function encounterFromReservation(
  reservation: Reservation,
  patientId: string,
): Encounter {
  const type = inferEncounterType(reservation.service_label);
  return {
    id: `res-${reservation.id}`,
    patientId,
    timestamp: reservation.starts_at,
    type,
    toothNumbers: [],
    providerId: "dr-karim",
    notes: reservation.notes,
    conditionIds: [],
    graphAnchor: anchorForEncounter(type),
  };
}

export function assembleDentalChart(
  patient: PatientProfile,
  reservations: Reservation[],
): DentalChart {
  const conditions = seedConditions();
  const byTooth = new Map<number, typeof conditions>();
  for (const node of conditions) {
    const list = byTooth.get(node.toothNumber) ?? [];
    list.push(node);
    byTooth.set(node.toothNumber, list);
  }
  const teeth = emptyTeeth().map((tooth) =>
    withToothAlerts({
      ...tooth,
      conditions: byTooth.get(tooth.toothNumber) ?? [],
    }),
  );
  const live = reservations.map((row) =>
    encounterFromReservation(row, patient.id),
  );
  return {
    patient,
    teeth,
    conditions,
    encounters: [...seedEncounters(patient.id), ...live],
    media: seedMedia(),
    labs: seedLabs(patient.id),
    prescriptions: seedPrescriptions(patient.id),
  };
}
