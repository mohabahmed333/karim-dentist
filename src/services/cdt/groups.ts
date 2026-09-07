import type { CdtGroup } from "./types";

export const GROUP_ORDER: readonly CdtGroup[] = [
  "exam",
  "filling",
  "endo",
  "extract",
  "crown",
  "perio",
  "implant",
  "other",
];

export const GROUP_LABELS: Record<CdtGroup, string> = {
  exam: "Exam & emergency",
  filling: "Fillings",
  endo: "Root canal",
  extract: "Extraction",
  crown: "Crowns",
  perio: "Gum / cleaning",
  implant: "Implants & dentures",
  other: "Other",
};
