import type { CdtPhase } from "./types";
import { defaultPhaseForCdt } from "./phases";

export type CareBucket = "immediate" | "planned";

const IMMEDIATE_DX = /\b(pain|infection|deep decay)\b/i;
const PLANNED_DX = /\b(restorative|prosthodontics?)\b/i;

export function careBucketFromDiagnosis(text: string): CareBucket | null {
  if (IMMEDIATE_DX.test(text)) return "immediate";
  if (PLANNED_DX.test(text)) return "planned";
  return null;
}

export function careBucketForCdt(code: string): CareBucket {
  return defaultPhaseForCdt(code) === "urgent" ? "immediate" : "planned";
}

export function careBucketFor(input: {
  cdtCode?: string | null;
  diagnosis?: string;
}): CareBucket {
  const diagnosis = input.diagnosis?.trim();
  if (diagnosis) {
    const fromDx = careBucketFromDiagnosis(diagnosis);
    if (fromDx) return fromDx;
  }
  if (input.cdtCode) return careBucketForCdt(input.cdtCode);
  return "planned";
}

export function phaseForCareBucket(bucket: CareBucket): CdtPhase {
  return bucket === "immediate" ? "urgent" : "restorative";
}

export function oppositeCareBucket(bucket: CareBucket): CareBucket {
  return bucket === "immediate" ? "planned" : "immediate";
}

export function phaseAfterToggle(bucket: CareBucket): CdtPhase {
  return phaseForCareBucket(oppositeCareBucket(bucket));
}
