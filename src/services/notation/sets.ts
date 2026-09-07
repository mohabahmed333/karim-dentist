import type { Dentition } from "./types";

export const ADULT_UPPER_RIGHT = [
  "18", "17", "16", "15", "14", "13", "12", "11",
] as const;
export const ADULT_UPPER_LEFT = [
  "21", "22", "23", "24", "25", "26", "27", "28",
] as const;
export const ADULT_LOWER_LEFT = [
  "31", "32", "33", "34", "35", "36", "37", "38",
] as const;
export const ADULT_LOWER_RIGHT = [
  "48", "47", "46", "45", "44", "43", "42", "41",
] as const;

export const PRIMARY_UPPER_RIGHT = ["55", "54", "53", "52", "51"] as const;
export const PRIMARY_UPPER_LEFT = ["61", "62", "63", "64", "65"] as const;
export const PRIMARY_LOWER_LEFT = ["71", "72", "73", "74", "75"] as const;
export const PRIMARY_LOWER_RIGHT = ["85", "84", "83", "82", "81"] as const;

const ADULT = [
  ...ADULT_UPPER_RIGHT,
  ...ADULT_UPPER_LEFT,
  ...ADULT_LOWER_LEFT,
  ...ADULT_LOWER_RIGHT,
];
const PRIMARY = [
  ...PRIMARY_UPPER_RIGHT,
  ...PRIMARY_UPPER_LEFT,
  ...PRIMARY_LOWER_LEFT,
  ...PRIMARY_LOWER_RIGHT,
];

export function fdiSet(dentition: Dentition): readonly string[] {
  return dentition === "primary" ? PRIMARY : ADULT;
}

export function adjacentChartFdi(
  current: string,
  dentition: Dentition,
  direction: "prev" | "next",
): string {
  const set = fdiSet(dentition);
  const index = set.indexOf(current);
  if (index < 0) return set[0] ?? "11";
  const delta = direction === "next" ? 1 : -1;
  return set[(index + delta + set.length) % set.length] ?? set[0] ?? "11";
}
