import type { Tables } from "@/lib/supabase/database.types";
import type { Reservation } from "@/services/reservations/types";

export type PatientTreatment = Tables<"patient_treatments">;
export type PatientTreatmentAttachment = Tables<"patient_treatment_attachments">;
export type TreatmentAttachmentKind = PatientTreatmentAttachment["kind"];

export type TreatmentSeverity = PatientTreatment["severity"];
export type TreatmentStatus = PatientTreatment["status"];

export type TreatmentAiInsight = {
  title: string;
  description: string;
  confidence: number;
  recommendation: string;
};

export type TreatmentAppointment = {
  id: string;
  startsAt: string;
  status: Reservation["status"];
  serviceLabel: string;
  notes: string;
};

export type TreatmentItem = {
  id: string;
  toothName: string;
  toothFdi: string | null;
  severity: TreatmentSeverity;
  lastTreatment: string;
  status: TreatmentStatus;
  reservationId: string | null;
  cdtCode: string | null;
  phase: "urgent" | "restorative" | "prosthodontic";
  feeAmount: number;
  createdAt: string;
  appointment?: TreatmentAppointment;
  attachments: PatientTreatmentAttachment[];
  aiInsight?: TreatmentAiInsight;
};

export type PatientTreatmentRow = PatientTreatment & {
  reservation?: Reservation | null;
  patient_treatment_attachments?: PatientTreatmentAttachment[] | null;
};

export function toTreatmentItem(row: PatientTreatmentRow): TreatmentItem {
  const hasInsight =
    Boolean(row.ai_title?.trim()) ||
    Boolean(row.ai_description?.trim()) ||
    Boolean(row.ai_recommendation?.trim());

  const aiInsight: TreatmentAiInsight | undefined = hasInsight
    ? {
        title: row.ai_title ?? "",
        description: row.ai_description ?? "",
        confidence: row.ai_confidence ?? 0,
        recommendation: row.ai_recommendation ?? "",
      }
    : undefined;

  const reservation = row.reservation ?? null;
  const appointment: TreatmentAppointment | undefined =
    reservation && !reservation.deleted_at
      ? {
          id: reservation.id,
          startsAt: reservation.starts_at,
          status: reservation.status,
          serviceLabel: reservation.service_label,
          notes: reservation.notes ?? "",
        }
      : undefined;

  return {
    id: row.id,
    toothName: row.tooth_name,
    toothFdi: row.tooth_fdi,
    severity: row.severity,
    lastTreatment: row.last_treatment,
    status: row.status,
    reservationId: row.reservation_id,
    cdtCode: row.cdt_code ?? null,
    phase: row.phase ?? "restorative",
    feeAmount: row.fee_amount ?? 0,
    createdAt: row.created_at,
    appointment,
    attachments: row.patient_treatment_attachments ?? [],
    aiInsight,
  };
}
