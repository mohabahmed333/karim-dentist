"use client";

import { useMemo, useState } from "react";
import {
  proceduresFromTreatments,
  type ProcedureSource,
  type TreatmentPlannerState,
} from "@/services/cdt";
import type { NotationSystem } from "@/services/notation";
import type { TreatmentItem } from "@/services/patient_treatments";

function toSource(item: TreatmentItem): ProcedureSource {
  return {
    id: item.id,
    toothName: item.toothName,
    toothFdi: item.toothFdi,
    lastTreatment: item.lastTreatment,
    cdtCode: item.cdtCode,
    phase: item.phase,
    feeAmount: item.feeAmount,
    status: item.status,
    appointmentStartsAt: item.appointment?.startsAt ?? null,
  };
}

export function useTreatmentPlanner(
  items: TreatmentItem[],
  notation: NotationSystem,
  insurancePercentage: number,
): TreatmentPlannerState & { setEditingFeeId: (id: string | null) => void } {
  const procedures = useMemo(
    () => proceduresFromTreatments(items.map(toSource), notation),
    [items, notation],
  );
  const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
  return { procedures, insurancePercentage, editingFeeId, setEditingFeeId };
}
