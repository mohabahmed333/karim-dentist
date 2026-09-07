import { isChartFdi } from "./types";

const SIDE: Record<string, string> = {
  "1": "Upper right",
  "2": "Upper left",
  "3": "Lower left",
  "4": "Lower right",
  "5": "Upper right",
  "6": "Upper left",
  "7": "Lower left",
  "8": "Lower right",
};

const ADULT: Record<string, string> = {
  "1": "central incisor",
  "2": "lateral incisor",
  "3": "canine",
  "4": "first premolar",
  "5": "second premolar",
  "6": "first molar",
  "7": "second molar",
  "8": "third molar",
};

const PRIMARY: Record<string, string> = {
  "1": "central incisor",
  "2": "lateral incisor",
  "3": "canine",
  "4": "first molar",
  "5": "second molar",
};

export function chartToothName(fdi: string): string {
  if (!isChartFdi(fdi)) return "Tooth";
  const quad = fdi[0] ?? "1";
  const pos = fdi[1] ?? "1";
  const names = quad >= "5" ? PRIMARY : ADULT;
  return `${SIDE[quad] ?? "Tooth"} ${names[pos] ?? "tooth"}`;
}

export function mesialOnRight(fdi: string): boolean {
  const quad = fdi[0] ?? "1";
  return quad === "1" || quad === "4" || quad === "5" || quad === "8";
}
