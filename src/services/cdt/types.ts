export type CdtPhase = "urgent" | "restorative" | "prosthodontic";

export type CdtGroup =
  | "exam"
  | "filling"
  | "endo"
  | "extract"
  | "crown"
  | "perio"
  | "implant"
  | "other";

export type CdtEntry = {
  code: string;
  title: string;
  shortLabel: string;
  group: CdtGroup;
  defaultPhase: CdtPhase;
};
