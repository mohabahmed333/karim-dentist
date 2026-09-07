import { planTotals, type BillableRow } from "./totals";

export type FeeRateId = "standard" | "insurance" | "package";

export const FEE_RATE_PRESETS = [
  { id: "standard", label: "Standard Fee", discountPct: 0 },
  { id: "insurance", label: "Insurance Rate (−20%)", discountPct: 20 },
  { id: "package", label: "Package Rate (−10%)", discountPct: 10 },
] as const;

export function pctFromFeeRate(id: FeeRateId): number {
  const row = FEE_RATE_PRESETS.find((item) => item.id === id);
  return row?.discountPct ?? 0;
}

export function feeRateFromPct(pct: number): FeeRateId {
  if (pct === 20) return "insurance";
  if (pct === 10) return "package";
  return "standard";
}

export function feeSummary(rows: BillableRow[], discountPct: number) {
  const totals = planTotals(rows, discountPct);
  return {
    totalFee: totals.gross,
    discount: totals.insurance,
    balance: totals.oop,
  };
}
