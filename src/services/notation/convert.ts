import { fdiForUniversal, universalForFdi as adultUniversal } from "../dental_chart/numbering";
import { isChartFdi } from "./types";

const PRIMARY_LETTER: Record<string, string> = {
  "55": "A", "54": "B", "53": "C", "52": "D", "51": "E",
  "61": "F", "62": "G", "63": "H", "64": "I", "65": "J",
  "75": "K", "74": "L", "73": "M", "72": "N", "71": "O",
  "81": "P", "82": "Q", "83": "R", "84": "S", "85": "T",
};

export function fdiForUniversalAdult(n: number): string | null {
  const fdi = fdiForUniversal(n);
  return fdi || null;
}

export function universalForFdi(fdi: string): number | string | null {
  if (!isChartFdi(fdi)) return null;
  const letter = PRIMARY_LETTER[fdi];
  if (letter) return letter;
  return adultUniversal(fdi);
}
