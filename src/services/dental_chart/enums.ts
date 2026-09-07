export const ARCHES = ["MAXILLARY", "MANDIBULAR"] as const;
export type Arch = (typeof ARCHES)[number];

export const CONDITION_TYPES = [
  "PULPITIS",
  "GINGIVAL_RECESSION",
  "PERIODONTITIS",
  "ENDODONTIC_INFECTION",
  "PERIAPICAL_ABSCESS",
  "TOOTH_FRACTURE",
  "IMPLANT_DEGRADATION",
] as const;
export type ConditionType = (typeof CONDITION_TYPES)[number];

export const SEVERITIES = ["LOW", "MED", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const CONDITION_STATUSES = ["ACTIVE", "RESOLVED", "MONITORING"] as const;
export type ConditionStatus = (typeof CONDITION_STATUSES)[number];

export const ENCOUNTER_TYPES = [
  "PULPECTOMY",
  "PERIO_PROBING",
  "CBCT_SCAN",
  "CROWN_PREP",
] as const;
export type EncounterType = (typeof ENCOUNTER_TYPES)[number];

export const MEDIA_TYPES = ["CBCT_3D", "PERIAPICAL_XRAY", "BITEWING"] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export const APPLIANCE_TYPES = [
  "ZIRCONIA_CROWN",
  "NIGHT_GUARD",
  "ALIGNER",
] as const;
export type ApplianceType = (typeof APPLIANCE_TYPES)[number];

export const LAB_STATUSES = [
  "IMPRESSION",
  "FABRICATION",
  "SHIPPED",
  "DELIVERED",
] as const;
export type LabStatus = (typeof LAB_STATUSES)[number];

export const RX_FREQUENCIES = [
  "ONCE_DAILY",
  "TWICE_DAILY",
  "NIGHT_ONLY",
] as const;
export type RxFrequency = (typeof RX_FREQUENCIES)[number];

export const RX_STATUSES = ["ACTIVE", "EXPIRED"] as const;
export type RxStatus = (typeof RX_STATUSES)[number];

export const GRAPH_ANCHORS = [
  "vitality",
  "perio",
  "culture",
  "bone",
  "biopsy",
  "cbct",
  "note",
  "hospital",
  "tmj",
  "occlusion",
] as const;
export type GraphAnchor = (typeof GRAPH_ANCHORS)[number];
