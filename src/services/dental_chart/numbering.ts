import type { Arch } from "./enums";

const UNIVERSAL_TO_FDI: Record<number, string> = {
  1: "18",
  2: "17",
  3: "16",
  4: "15",
  5: "14",
  6: "13",
  7: "12",
  8: "11",
  9: "21",
  10: "22",
  11: "23",
  12: "24",
  13: "25",
  14: "26",
  15: "27",
  16: "28",
  17: "38",
  18: "37",
  19: "36",
  20: "35",
  21: "34",
  22: "33",
  23: "32",
  24: "31",
  25: "41",
  26: "42",
  27: "43",
  28: "44",
  29: "45",
  30: "46",
  31: "47",
  32: "48",
};

export function fdiForUniversal(tooth: number): string {
  return UNIVERSAL_TO_FDI[tooth] ?? "";
}

export function universalForFdi(fdi: string): number | null {
  const match = Object.entries(UNIVERSAL_TO_FDI).find(([, value]) => value === fdi);
  return match ? Number(match[0]) : null;
}

export function archForUniversal(tooth: number): Arch {
  return tooth <= 16 ? "MAXILLARY" : "MANDIBULAR";
}

export function emptyArchNumbers(): number[] {
  return Array.from({ length: 32 }, (_, index) => index + 1);
}
