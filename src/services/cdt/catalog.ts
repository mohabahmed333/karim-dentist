import type { CdtEntry } from "./types";
import { CDT_CATALOG } from "./catalogData";

export { CDT_CATALOG };

export function cdtByCode(code: string): CdtEntry | undefined {
  return CDT_CATALOG.find((row) => row.code === code);
}

export function chipLabelFor(code: string): string {
  return `+ ${cdtByCode(code)?.shortLabel ?? code}`;
}

export function shortLabelFor(code: string): string {
  return cdtByCode(code)?.shortLabel ?? code;
}
