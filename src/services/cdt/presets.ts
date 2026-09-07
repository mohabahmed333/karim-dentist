export const TREATMENT_PRESETS = [
  { id: "fill", label: "+ Fill", code: "D2391", fee: 150 },
  { id: "crown", label: "+ Crown", code: "D2740", fee: 900 },
  { id: "endo", label: "+ Root Canal", code: "D3330", fee: 650 },
  { id: "extract", label: "+ Extract", code: "D7140", fee: 200 },
] as const;

export type TreatmentPreset = (typeof TREATMENT_PRESETS)[number];
