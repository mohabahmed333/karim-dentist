import type {
  ApplianceType,
  ConditionType,
  EncounterType,
  LabStatus,
  RxFrequency,
} from "@/services/dental_chart/enums";

export const CONDITION_LABELS: Record<ConditionType, string> = {
  PULPITIS: "Pulpitis / Cavity",
  GINGIVAL_RECESSION: "Gingival Recession",
  PERIODONTITIS: "Periodontitis",
  ENDODONTIC_INFECTION: "Endodontic Infection",
  PERIAPICAL_ABSCESS: "Periapical Abscess",
  TOOTH_FRACTURE: "Tooth Fracture",
  IMPLANT_DEGRADATION: "Implant Degradation",
};

export const TIMELINE_YEARS = [
  2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014,
] as const;

export const ENCOUNTER_LABELS: Record<EncounterType, string> = {
  PULPECTOMY: "Pulpectomy Stage 1",
  PERIO_PROBING: "Perio Probing",
  CBCT_SCAN: "CBCT",
  CROWN_PREP: "Crown Prep",
};

export const APPLIANCE_LABELS: Record<ApplianceType, string> = {
  ZIRCONIA_CROWN: "Zirconia Crown",
  NIGHT_GUARD: "Night Guard",
  ALIGNER: "Aligner",
};

export const LAB_STATUS_LABELS: Record<LabStatus, string> = {
  IMPRESSION: "Impression",
  FABRICATION: "Fabrication",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
};

export const RX_TIMING: Record<RxFrequency, "night" | "both" | "none"> = {
  ONCE_DAILY: "night",
  TWICE_DAILY: "both",
  NIGHT_ONLY: "night",
};
