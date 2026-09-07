export type DashboardTab =
  | "history"
  | "clinical"
  | "teeth"
  | "charting"
  // DISABLED: clinical EHR tabs — kept for future restore
  // | "xray"
  // | "overview"
  // | "notes"
  // | "perio"
  // | "labs"
  // | "imaging"
  ;

export type CardAnchor =
  | "vitality"
  | "perio"
  | "culture"
  | "bone"
  | "biopsy"
  | "cbct"
  | "note"
  | "hospital"
  | "tmj"
  | "occlusion";

export type ToothType =
  | "central"
  | "lateral"
  | "canine"
  | "premolar"
  | "molar";

export type ArchToothSpec = {
  universal: number;
  x: number;
  y: number;
  z: number;
  rotateY: number;
  type: ToothType;
};

export type Point = { x: number; y: number };
