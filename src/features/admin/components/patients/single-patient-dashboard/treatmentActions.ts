import type { QuickAction, Treatment, TreatmentSeverity } from "./types";

const QUICK_ACTION_META: Record<
  QuickAction,
  { cdtCode: string; procedureName: string; severity: TreatmentSeverity; fee: number }
> = {
  Fill: {
    cdtCode: "D2391",
    procedureName: "Resin-based composite — one surface",
    severity: "Minor",
    fee: 180,
  },
  Crown: {
    cdtCode: "D2740",
    procedureName: "Crown — porcelain/ceramic",
    severity: "Critical",
    fee: 1200,
  },
  Extract: {
    cdtCode: "D7140",
    procedureName: "Extraction — erupted tooth",
    severity: "Critical",
    fee: 250,
  },
};

export function appendQuickTreatment(
  treatments: Treatment[],
  tooth: number,
  action: QuickAction,
): Treatment[] {
  const meta = QUICK_ACTION_META[action];
  const row: Treatment = {
    id: `tx-${tooth}-${action}-${Date.now()}`,
    tooth,
    ...meta,
  };
  return [...treatments, row];
}

export function toothConditionTint(
  treatments: Treatment[],
  tooth: number,
): TreatmentSeverity | null {
  const forTooth = treatments.filter((t) => t.tooth === tooth);
  if (forTooth.length === 0) return null;
  if (forTooth.some((t) => t.severity === "Critical")) return "Critical";
  return "Minor";
}
