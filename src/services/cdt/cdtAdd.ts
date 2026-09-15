import type { Service } from "../services/types";
import { chartToothName } from "../notation/names";
import { cdtByCode } from "./catalog";
import { defaultPhaseForCdt, isUrgentCdt } from "./phases";
import type { CdtPhase } from "./types";

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

/** Same shape as cdtAddPayload, for a treatment picked from the Services catalog instead of a CDT code — no clinic-configured fee to price it from, so the service's own minimum stands in. */
export function serviceAddPayload(
  fdi: string,
  service: Service,
  phase: CdtPhase = "restorative",
) {
  return {
    tooth_name: chartToothName(fdi),
    tooth_fdi: fdi,
    severity: "Minor" as const,
    last_treatment: service.title,
    cdt_code: null,
    phase,
    fee_amount: service.price_min_egp ?? 0,
    status: "open" as const,
    ai_title: null,
    ai_description: null,
    ai_confidence: null,
    ai_recommendation: null,
  };
}
