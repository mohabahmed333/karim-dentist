"use client";

import {
  Calendar,
  Clock,
  Pencil,
  RefreshCw,
  Trash2,
} from "lucide-react";
import type { ClinicalNote } from "@/services/clinical_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import { isRichTextEmpty, RichTextHtml } from "../richTextUtils";
import { TreatmentAppointmentCard } from "../treatments/TreatmentAppointmentCard";
import { TreatmentAttachmentsPreview } from "../treatments/TreatmentAttachmentsPreview";
import { TreatmentInlineNotes } from "./TreatmentInlineNotes";

type Props = {
  item: TreatmentItem;
  notes: ClinicalNote[];
  onBook: () => void;
  onReplace: () => void;
  onEdit: () => void;
  onSaveNote: (content: string) => void;
  onDelete: () => void;
};

export function TreatmentTimelineBody({
  item,
  notes,
  onBook,
  onReplace,
  onEdit,
  onSaveNote,
  onDelete,
}: Props) {
  const hasAppointment = Boolean(item.appointment);

  return (
    <div className="space-y-3 border-t border-slate-100 px-3 pb-3 pt-1">
      {!isRichTextEmpty(item.lastTreatment) ? (
        <div className="flex items-start gap-2 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5 text-[12px] text-[#64748B]">
          <Clock className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <p className="mb-1 font-medium text-[#0F172A]">Last treatment</p>
            <RichTextHtml html={item.lastTreatment} />
          </div>
        </div>
      ) : null}
      {item.attachments.length > 0 ? (
        <TreatmentAttachmentsPreview attachments={item.attachments} />
      ) : null}
      {item.appointment ? (
        <TreatmentAppointmentCard appointment={item.appointment} />
      ) : null}

      <TreatmentInlineNotes notes={notes} onSave={onSaveNote} />

      <div className="flex flex-wrap gap-2">
        <Action
          label="Edit"
          onClick={onEdit}
          className="bg-[#F1F5F9] text-[#334155] hover:bg-[#E2E8F0]"
          icon={Pencil}
        />
        {hasAppointment ? (
          <Action
            label="Replace appointment"
            onClick={onReplace}
            className="bg-[#FEF3C7] text-[#92400E] hover:bg-[#FDE68A]"
            icon={RefreshCw}
          />
        ) : (
          <Action
            label="Book Now"
            onClick={onBook}
            className="bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#BFDBFE]"
            icon={Calendar}
          />
        )}
        <Action
          label="Delete"
          onClick={onDelete}
          className="bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FECACA]"
          icon={Trash2}
        />
      </div>
    </div>
  );
}

function Action({
  label,
  onClick,
  className,
  icon: Icon,
}: {
  label: string;
  onClick: () => void;
  className: string;
  icon: typeof Pencil;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${className}`}
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
