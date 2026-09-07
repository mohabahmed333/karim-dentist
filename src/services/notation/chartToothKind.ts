export type ChartToothKind =
  | "central"
  | "lateral"
  | "canine"
  | "premolar"
  | "molar";

const ADULT: Record<string, ChartToothKind> = {
  "1": "central",
  "2": "lateral",
  "3": "canine",
  "4": "premolar",
  "5": "premolar",
  "6": "molar",
  "7": "molar",
  "8": "molar",
};

/** Crown silhouette kind for Charting hybrid glyphs (adult + primary). */
export function chartToothKind(fdi: string): ChartToothKind {
  const quad = fdi[0] ?? "1";
  const pos = fdi[1] ?? "1";
  if (quad >= "5") {
    if (pos === "1") return "central";
    if (pos === "2") return "lateral";
    if (pos === "3") return "canine";
    return "molar";
  }
  return ADULT[pos] ?? "molar";
}
