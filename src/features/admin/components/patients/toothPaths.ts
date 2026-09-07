import type { ToothType } from "@/services/patient_tooth_findings/fdi";

export type ToothGlyph = { outline: string; grooves: string[] };

export const TOOTH_GLYPHS: Record<ToothType, ToothGlyph> = {
  central: {
    outline: "M -4.6,-14.5 L 4.6,-14.5 L 4.2,13.5 Q 0,15.5 -4.2,13.5 Z",
    grooves: ["M 0,-12 L 0,10"],
  },
  lateral: {
    outline: "M -3.6,-13.5 L 3.6,-13.5 L 3.3,12.5 Q 0,14.2 -3.3,12.5 Z",
    grooves: ["M 0,-11 L 0,9"],
  },
  canine: {
    outline: "M 0,-16.5 L 5.2,-5 L 4.2,13 Q 0,15 -4.2,13 L -5.2,-5 Z",
    grooves: ["M 0,-12 L 0,8"],
  },
  premolar: {
    outline:
      "M -6.8,-14 Q -7.4,-16.2 -3.2,-16.2 L 3.2,-16.2 Q 7.4,-16.2 6.8,-14 L 6,13 Q 0,15.4 -6,13 Z",
    grooves: ["M -2.2,-13 L -1.6,8", "M 2.2,-13 L 1.6,8"],
  },
  molar: {
    outline:
      "M -9.2,-13 Q -10.2,-16.4 -5,-16.4 L 5,-16.4 Q 10.2,-16.4 9.2,-13 L 8.2,13 Q 0,16.5 -8.2,13 Z",
    grooves: [
      "M -3.4,-13 L -2.6,8",
      "M 3.4,-13 L 2.6,8",
      "M -6,0 Q 0,2.4 6,0",
    ],
  },
};

export const TOOTH_SCALE: Record<ToothType, number> = {
  central: 0.92,
  lateral: 0.82,
  canine: 0.9,
  premolar: 1.02,
  molar: 1.18,
};
