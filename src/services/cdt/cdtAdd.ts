import { chartToothName } from "../notation/names";
import { cdtByCode } from "./catalog";
import { defaultPhaseForCdt, isUrgentCdt } from "./phases";

export function cdtAddPayload(fdi: string, code: string, fee: number) {
  const entry = cdtByCode(code);
  if (!entry) return null;
  return {
    tooth_name: chartToothName(fdi),
    tooth_fdi: fdi,
    severity: isUrgentCdt(code) ? ("Critical" as const) : ("Minor" as const),
    last_treatment: entry.title,
    cdt_code: entry.code,
    phase: defaultPhaseForCdt(entry.code),
    fee_amount: fee,
    status: "open" as const,
    ai_title: null,
    ai_description: null,
    ai_confidence: null,
    ai_recommendation: null,
  };
}
