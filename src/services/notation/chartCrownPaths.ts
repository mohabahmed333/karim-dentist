import type { ChartToothKind } from "./chartToothKind";

/** Occlusal-ish crown silhouettes for Charting hybrid glyphs (viewBox 0 0 40 52). */
export const CHART_CROWN_PATHS: Record<ChartToothKind, string> = {
  central:
    "M 13 3 C 16 1 24 1 27 3 L 29 46 C 26 51 14 51 11 46 Z",
  lateral:
    "M 15 4 C 17 2 23 2 25 4 L 26 44 C 24 49 16 49 14 44 Z",
  canine:
    "M 20 1 L 32 18 L 28 46 C 24 51 16 51 12 46 L 8 18 Z",
  premolar:
    "M 8 7 C 6 2 13 1 16 1 H 24 C 27 1 34 2 32 7 L 33 45 C 29 51 11 51 7 45 Z",
  molar:
    "M 3 9 C 1 2 11 1 14 1 H 26 C 29 1 39 2 37 9 L 36 45 C 31 52 9 52 4 45 Z",
};

export const CHART_CROWN_WIDTH: Record<ChartToothKind, string> = {
  central: "w-6",
  lateral: "w-5",
  canine: "w-6",
  premolar: "w-7",
  molar: "w-8",
};
