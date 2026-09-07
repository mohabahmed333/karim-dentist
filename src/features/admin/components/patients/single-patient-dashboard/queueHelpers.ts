import { toothName } from "@/services/patient_tooth_findings/fdi";
import { UNIVERSAL_TO_FDI } from "../ehr-view/ehr.types";
import type { CdtQuickAction, QueueRow } from "./clinicalTypes";
import { openBalanceEgp } from "./queueHelpers.pure";

export { openBalanceEgp };

export function fdiFromUniversal(universal: number): string | null {
  return UNIVERSAL_TO_FDI[universal] ?? null;
}

export function labelForTooth(
  universal: number | null,
  fdi: string | null,
): string {
  if (fdi) return `Tooth #${fdi} · ${toothName(fdi)}`;
  if (universal != null) return `Tooth #${universal}`;
  return "No tooth selected";
}

export function appendCdtToQueue(
  queue: QueueRow[],
  universal: number,
  action: CdtQuickAction,
): QueueRow[] {
  const fdi = fdiFromUniversal(universal);
  const row: QueueRow = {
    id: `session-${action.id}-${universal}-${Date.now()}`,
    toothFdi: fdi,
    toothLabel: fdi ? `${toothName(fdi)} (#${fdi})` : `Tooth #${universal}`,
    cdtCode: action.cdtCode,
    description: action.procedureName,
    severity: action.severity,
    status: "open",
    feeAmount: action.feeAmount,
    imageUrls: [],
    source: "session",
  };
  return [row, ...queue];
}
