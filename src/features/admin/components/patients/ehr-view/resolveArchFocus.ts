import { UNIVERSAL_TO_FDI } from "./ehr.types";

type FocusCondition = {
  fdi: string | null;
  toothUniversal: number | null;
};

type Args = {
  /** Tooth the user last clicked (universal), if any. */
  selectedToothId: number | null;
  /** Condition currently open in the ledger, if any. */
  condition: FocusCondition | null;
};

/**
 * Which tooth the arch highlights and the label names.
 *
 * The click wins: an open condition is only the fallback for "nothing picked
 * yet". Reading the condition first made clicking a tooth with no recorded
 * condition leave the highlight on the previous one, so the selected tooth
 * was never the tooth under the pointer.
 */
export function resolveArchFocus({ selectedToothId, condition }: Args): {
  universal: number | null;
  fdi: string | null;
} {
  const universal = selectedToothId ?? condition?.toothUniversal ?? null;
  const fdi =
    (universal != null ? UNIVERSAL_TO_FDI[universal] ?? null : null) ??
    condition?.fdi ??
    null;
  return { universal, fdi };
}
