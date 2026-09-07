import type { NotationSystem } from "../notation/types";
import { displayTooth } from "../notation/display";
import type { CdtPhase } from "./types";
import type { CareBucket } from "./careBucket";
import { phaseForCareBucket } from "./careBucket";
import { formatAppointmentLabel } from "./appointmentLabel";

export type PlannerPhaseId = CareBucket;

export type ProcedureStatus = "open" | "scheduled" | "done";

export type ProcedureItem = {
  id: string;
  cdtCode: string;
  description: string;
  toothNumber: string;
  phaseId: PlannerPhaseId;
  fee: number;
  status: ProcedureStatus;
  appointmentLabel: string | null;
};

export type TreatmentPlannerState = {
  procedures: ProcedureItem[];
  insurancePercentage: number;
  editingFeeId: string | null;
};

export type ProcedureSource = {
  id: string;
  toothName: string;
  toothFdi: string | null;
  lastTreatment: string;
  cdtCode: string | null;
  phase: CdtPhase;
  feeAmount: number;
  status: ProcedureStatus;
  appointmentStartsAt?: string | null;
};

export function phaseIdFromCdt(phase: CdtPhase): PlannerPhaseId {
  return phase === "urgent" ? "immediate" : "planned";
}

export function cdtPhaseFromId(id: PlannerPhaseId): CdtPhase {
  return phaseForCareBucket(id);
}

function descriptionOf(item: ProcedureSource): string {
  const text = item.lastTreatment.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text || item.toothName;
}

export function toProcedureItem(
  item: ProcedureSource,
  notation: NotationSystem,
): ProcedureItem {
  const startsAt = item.appointmentStartsAt ?? null;
  return {
    id: item.id,
    cdtCode: item.cdtCode ?? "-",
    description: descriptionOf(item),
    toothNumber: item.toothFdi ? displayTooth(item.toothFdi, notation) : "—",
    phaseId: phaseIdFromCdt(item.phase),
    fee: item.feeAmount,
    status: item.status,
    appointmentLabel: startsAt ? formatAppointmentLabel(startsAt) : null,
  };
}

export function proceduresFromTreatments(
  items: ProcedureSource[],
  notation: NotationSystem,
): ProcedureItem[] {
  return items.map((item) => toProcedureItem(item, notation));
}

export function proceduresInPhase(
  procedures: ProcedureItem[],
  phaseId: PlannerPhaseId,
): ProcedureItem[] {
  return procedures.filter((row) => row.phaseId === phaseId);
}
