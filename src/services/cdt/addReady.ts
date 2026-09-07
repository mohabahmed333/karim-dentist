import { parseChartingFee } from "./parseFee";

export type CdtAddDraft = {
  hasTooth: boolean;
  code: string;
  fee: string;
};

export function cdtAddBlocked(draft: CdtAddDraft): string | null {
  if (!draft.hasTooth) return "Click a tooth on the chart";
  if (!draft.code) return "Pick a CDT procedure";
  if (parseChartingFee(draft.fee) === null) return "Type the fee in whole EGP";
  return null;
}
