export const UPPER_RIGHT = ["18", "17", "16", "15", "14", "13", "12", "11"] as const;
export const UPPER_LEFT = ["21", "22", "23", "24", "25", "26", "27", "28"] as const;
export const LOWER_LEFT = ["31", "32", "33", "34", "35", "36", "37", "38"] as const;
export const LOWER_RIGHT = ["48", "47", "46", "45", "44", "43", "42", "41"] as const;

export const FDI_NUMBERS = [
  ...UPPER_RIGHT,
  ...UPPER_LEFT,
  ...LOWER_LEFT,
  ...LOWER_RIGHT,
] as const;

export type FdiNumber = (typeof FDI_NUMBERS)[number];
export type ToothType = "central" | "lateral" | "canine" | "premolar" | "molar";
export type ToothVisualState = "unmarked" | "has-comment" | "active";

const POSITION_NAMES: Record<string, string> = {
  "1": "central incisor",
  "2": "lateral incisor",
  "3": "canine",
  "4": "first premolar",
  "5": "second premolar",
  "6": "first molar",
  "7": "second molar",
  "8": "third molar",
};

const TYPES: Record<string, ToothType> = {
  "1": "central",
  "2": "lateral",
  "3": "canine",
  "4": "premolar",
  "5": "premolar",
  "6": "molar",
  "7": "molar",
  "8": "molar",
};

export function isFdiNumber(value: string): value is FdiNumber {
  return (FDI_NUMBERS as readonly string[]).includes(value);
}

export function toothType(fdi: string): ToothType {
  return TYPES[fdi[1] ?? ""] ?? "molar";
}

export function toothName(fdi: string): string {
  const arch = fdi[0] === "1" || fdi[0] === "2" ? "Upper" : "Lower";
  const side = fdi[0] === "1" || fdi[0] === "4" ? "right" : "left";
  return `${arch} ${side} ${POSITION_NAMES[fdi[1] ?? ""] ?? "tooth"}`;
}

export function toothVisualState(
  fdi: string,
  selectedFdi: string | null,
  commented: ReadonlySet<string>,
): ToothVisualState {
  if (fdi === selectedFdi) return "active";
  if (commented.has(fdi)) return "has-comment";
  return "unmarked";
}

export function adjacentFdi(
  current: FdiNumber,
  direction: "prev" | "next",
): FdiNumber {
  const index = FDI_NUMBERS.indexOf(current);
  if (index < 0) return FDI_NUMBERS[0];
  const delta = direction === "next" ? 1 : -1;
  const next =
    (index + delta + FDI_NUMBERS.length) % FDI_NUMBERS.length;
  return FDI_NUMBERS[next];
}
