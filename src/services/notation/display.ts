import { universalForFdi } from "./convert";
import type { NotationSystem } from "./types";
import { isChartFdi } from "./types";

const PALMER_CORNER: Record<string, string> = {
  "1": "┘",
  "2": "└",
  "3": "┌",
  "4": "┐",
  "5": "┘",
  "6": "└",
  "7": "┌",
  "8": "┐",
};

const PRIMARY_PALMER = "ABCDE";

export function displayTooth(fdi: string, system: NotationSystem): string {
  if (!isChartFdi(fdi)) return "";
  if (system === "fdi") return fdi;
  if (system === "universal") {
    const value = universalForFdi(fdi);
    if (value == null) return "";
    return typeof value === "number" ? `#${value}` : value;
  }
  const quad = fdi[0] ?? "1";
  const pos = Number(fdi[1] ?? "1");
  const corner = PALMER_CORNER[quad] ?? "┘";
  if (quad >= "5") {
    const letter = PRIMARY_PALMER[pos - 1] ?? "A";
    return `${letter}${corner}`;
  }
  return `${pos}${corner}`;
}
