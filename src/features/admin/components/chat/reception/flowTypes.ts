import type { ClinicChatAction } from "@/services/clinic_chat";
import type { AnyMessageKey } from "@/lib/i18n";

export type BookDraft = {
  patientKey?: string;
  name?: string;
  phone?: string;
  serviceId?: string | null;
  serviceLabel?: string;
  date?: string;
  time?: string;
  slotId?: string | null;
};

export type NoteDraft = {
  patientKey?: string;
  name?: string;
  phone?: string;
  stamp?: string;
  text?: string;
};

export type ActivePatient = {
  patientKey: string;
  name: string;
  phone: string;
  href?: string;
  /** Reservation created/updated in this chat — next book becomes replace. */
  lastReservationId?: string;
  /** Notes saved in this chat — next note chip says add another. */
  noteCount?: number;
};

export type ReceptionDraft = {
  book: BookDraft;
  note: NoteDraft;
  rescheduleId?: string;
  activePatient?: ActivePatient;
};

type TFn = (key: AnyMessageKey) => string;

export function getNoteStamps(t: TFn): string[] {
  return [
    t("admin.chat.stamp.noAnswer"),
    t("admin.chat.stamp.confirmedPhone"),
    t("admin.chat.stamp.followUp"),
    t("admin.chat.stamp.allergy"),
    t("admin.chat.stamp.vip"),
  ];
}

export function getStartActions(t: TFn): ClinicChatAction[] {
  return [
    { id: "start:website", label: t("admin.chat.action.website") },
    { id: "start:chart", label: t("admin.chat.action.chart") },
    { id: "start:clinical", label: t("admin.chat.action.clinical") },
    { id: "start:book", label: t("admin.chat.action.book") },
    { id: "start:today", label: t("admin.chat.action.today") },
    { id: "start:pending", label: t("admin.chat.action.pending") },
    { id: "start:patient", label: t("admin.chat.action.findPatient") },
    { id: "start:noshow", label: t("admin.chat.action.noshow") },
    { id: "start:note", label: t("admin.chat.action.note") },
  ];
}

export function patientScopedActions(
  patient: ActivePatient,
  t: TFn,
): ClinicChatAction[] {
  const first = patient.name.split(" ")[0] ?? patient.name;
  const hasReservation = Boolean(patient.lastReservationId);
  const hasNote = (patient.noteCount ?? 0) > 0;
  return [
    {
      id: "patient:book",
      label: hasReservation
        ? t("admin.chat.action.replaceReservation")
        : t("admin.chat.action.bookFor").replace("{name}", first),
      payload: {
        patientKey: patient.patientKey,
        name: patient.name,
        phone: patient.phone,
        ...(patient.lastReservationId
          ? { reservationId: patient.lastReservationId }
          : {}),
      },
    },
    {
      id: "patient:note",
      label: hasNote
        ? t("admin.chat.action.addAnotherNote")
        : t("admin.chat.action.addNote"),
      payload: {
        patientKey: patient.patientKey,
        name: patient.name,
        phone: patient.phone,
      },
    },
    {
      id: "patient:goto",
      label: t("admin.chat.action.openWorkspace"),
      payload: {
        href:
          patient.href ??
          `/admin/patients/${encodeURIComponent(patient.patientKey)}`,
      },
    },
    { id: "start:patient", label: t("admin.chat.action.changePatient") },
    { id: "start:today", label: t("admin.chat.action.today") },
    { id: "start:pending", label: t("admin.chat.action.pending") },
  ];
}
