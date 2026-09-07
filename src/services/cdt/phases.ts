import type { CdtPhase } from "./types";

const URGENT_CODES = new Set(["D0140", "D3220", "D7510"]);
const ELECTIVE_D9 = new Set(["D9944", "D9972"]);

function cdtNumber(code: string): number | null {
  const n = Number.parseInt(code.replace(/^D/i, ""), 10);
  return Number.isFinite(n) ? n : null;
}

export function defaultPhaseForCdt(code: string): CdtPhase {
  const n = cdtNumber(code);
  if (n !== null) {
    if (n >= 3000 && n <= 3999) return "urgent";
    if (n >= 7000 && n <= 7999) return "urgent";
    if (n >= 2000 && n <= 2999) return "restorative";
    if (n >= 6000 && n <= 6999) return "prosthodontic";
  }
  if (ELECTIVE_D9.has(code)) return "prosthodontic";
  if (URGENT_CODES.has(code)) return "urgent";
  const family = code[1];
  if (family === "7" || family === "9") return "urgent";
  if (family === "1" || family === "2" || family === "3" || family === "4") {
    return "restorative";
  }
  return "prosthodontic";
}

export function isUrgentCdt(code: string): boolean {
  return defaultPhaseForCdt(code) === "urgent";
}
