export type BillableRow = {
  status: string;
  fee_amount: number;
};

export function planTotals(rows: BillableRow[], pct: number) {
  const gross = rows
    .filter((row) => row.status === "open" || row.status === "scheduled")
    .reduce((sum, row) => sum + row.fee_amount, 0);
  const clamped = Math.min(100, Math.max(0, pct));
  const insurance = Math.round((gross * clamped) / 100);
  return { gross, insurance, oop: gross - insurance };
}

export function formatEgp(amount: number): string {
  return `EGP ${amount.toLocaleString("en-EG")}`;
}
