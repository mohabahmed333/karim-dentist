import type { AiAssistChip, CdtQuickAction } from "./clinicalTypes";

export const CDT_QUICK_ACTIONS: CdtQuickAction[] = [
  {
    id: "fill",
    label: "+ Fill",
    cdtCode: "D2391",
    severity: "Minor",
    feeAmount: 180,
    procedureName: "Resin-based composite — one surface",
  },
  {
    id: "drain",
    label: "+ Drain abscess",
    cdtCode: "D7510",
    severity: "Critical",
    feeAmount: 320,
    procedureName: "Incision and drainage of abscess",
  },
  {
    id: "extract",
    label: "+ Extract",
    cdtCode: "D7140",
    severity: "Critical",
    feeAmount: 250,
    procedureName: "Extraction — erupted tooth",
  },
  {
    id: "surgical-extract",
    label: "+ Surgical extract",
    cdtCode: "D7210",
    severity: "Critical",
    feeAmount: 650,
    procedureName: "Surgical extraction of erupted tooth",
  },
];

export const AI_ASSIST_CHIPS: AiAssistChip[] = [
  {
    id: "deep-fill",
    label: "Deep filling",
    narrative:
      "Deep carious lesion approaching pulp. Place liner and resin restoration; monitor vitality.",
  },
  {
    id: "crown",
    label: "Crown",
    narrative:
      "Structural compromise warrants full-coverage crown. Prep, provisional, and lab porcelain/ceramic.",
  },
  {
    id: "rct",
    label: "RCT - Critical",
    narrative:
      "Irreversible pulpitis — needs root canal therapy from clinic menu before definitive restoration.",
  },
  {
    id: "extract",
    label: "Extract",
    narrative:
      "Non-restorable tooth. Discuss extraction, socket management, and replacement options.",
  },
];
