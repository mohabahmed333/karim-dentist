import type { ConditionType, EncounterType, GraphAnchor } from "./enums";

export function anchorForEncounter(type: EncounterType): GraphAnchor {
  if (type === "PULPECTOMY") return "vitality";
  if (type === "PERIO_PROBING") return "perio";
  if (type === "CBCT_SCAN") return "cbct";
  return "note";
}

export const TYPE_ANCHORS: Record<ConditionType, GraphAnchor[]> = {
  PULPITIS: ["vitality", "culture"],
  GINGIVAL_RECESSION: ["perio"],
  PERIODONTITIS: ["perio", "bone", "biopsy"],
  ENDODONTIC_INFECTION: [
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
  ],
  PERIAPICAL_ABSCESS: ["cbct", "biopsy", "hospital"],
  TOOTH_FRACTURE: ["note", "tmj", "occlusion"],
  IMPLANT_DEGRADATION: ["cbct", "bone"],
};
