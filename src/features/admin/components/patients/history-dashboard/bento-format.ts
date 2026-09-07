import {
  APPLIANCE_LABELS,
  ENCOUNTER_LABELS,
  LAB_STATUS_LABELS,
  RX_TIMING,
} from "@/services/dental_chart/labels";
import { LAB_STATUSES } from "@/services/dental_chart/enums";
import type { Encounter, LabOrder, Prescription } from "@/services/dental_chart";

export function rxTimes(rx: Prescription): number {
  return rx.frequency === "TWICE_DAILY" ? 2 : 1;
}

export function rxKind(rx: Prescription): "liquid" | "capsule" {
  return rx.drugName.toLowerCase().includes("rinse") ? "liquid" : "capsule";
}

export function rxTiming(rx: Prescription) {
  return RX_TIMING[rx.frequency];
}

export function visitChipDate(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function visitTitle(encounter: Encounter): string {
  const teeth = encounter.toothNumbers.map((n) => `#${n}`).join(" / ");
  const label = ENCOUNTER_LABELS[encounter.type];
  return teeth ? `${label} ${teeth} / Office visit` : `${label} / Office visit`;
}

export function labHeadline(lab: LabOrder): string {
  return `${APPLIANCE_LABELS[lab.applianceType]} #${lab.toothNumber} ${LAB_STATUS_LABELS[lab.status]}`;
}

export function labDotActive(lab: LabOrder): number {
  return LAB_STATUSES.indexOf(lab.status);
}
