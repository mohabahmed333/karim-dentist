"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { formatEgp, shortLabelFor } from "@/services/cdt";
import type { ClinicalNote } from "@/services/clinical_notes";
import type { TreatmentItem } from "@/services/patient_treatments";
import { TreatmentTimelineBody } from "./TreatmentTimelineBody";

type Props = {
  item: TreatmentItem;
  notes: ClinicalNote[];
  expanded: boolean;
  isLast: boolean;
  onToggle: () => void;
  onBook: () => void;
  onReplace: () => void;
  onEdit: () => void;
  onSaveNote: (content: string) => void;
  onDelete: () => void;
  onContext: (anchor: DOMRect) => void;
};

export function TreatmentTimelineItem({
  item,
  notes,
  expanded,
  isLast,
  onToggle,
  onBook,
  onReplace,
  onEdit,
  onSaveNote,
  onDelete,
  onContext,
}: Props) {
  const critical = item.severity === "Critical";
  const label = item.cdtCode ? shortLabelFor(item.cdtCode) : item.toothName;

  return (
    <div className="relative flex gap-3">
      <div className="flex w-4 shrink-0 flex-col items-center">
        <span
          className={`mt-3.5 size-3 shrink-0 rounded-full border-2 border-white shadow ${
            critical ? "bg-[#DC2626]" : "bg-[#2563EB]"
          }`}
        />
        {!isLast ? (
          <span className="mt-1 w-px flex-1 bg-[#CBD5E1]" aria-hidden />
        ) : null}
      </div>

      <motion.article
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-3 min-w-0 flex-1 overflow-hidden rounded-2xl border bg-white shadow-sm ${
          critical ? "border-[#FECACA]" : "border-slate-200/80"
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          onContextMenu={(e) => {
            e.preventDefault();
            onContext(e.currentTarget.getBoundingClientRect());
          }}
          className="flex w-full items-start gap-2 px-3 py-3 text-start"
        >
          {critical ? (
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#991B1B]" />
          ) : (
            <Info className="mt-0.5 size-4 shrink-0 text-[#92400E]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#0F172A]">
              {label}
              {item.cdtCode ? (
                <span className="ms-1.5 font-mono text-[11px] font-medium text-[#2563EB]">
                  {item.cdtCode}
                </span>
              ) : null}
            </p>
            <p className="mt-0.5 text-[11px] text-[#64748B]">
              {item.toothName}
              {item.toothFdi ? ` · #${item.toothFdi}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className="text-[13px] font-semibold tabular-nums text-[#0F172A]">
              {formatEgp(item.feeAmount)}
            </span>
            <div className="flex items-center gap-1">
              {item.appointment?.status === "confirmed" ? (
                <span className="rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[10px] font-semibold text-[#065F46]">
                  Confirmed
                </span>
              ) : item.status === "scheduled" ? (
                <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[10px] font-semibold text-[#1E40AF]">
                  Scheduled
                </span>
              ) : null}
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  critical
                    ? "bg-[#FEE2E2] text-[#991B1B]"
                    : "bg-[#FEF3C7] text-[#92400E]"
                }`}
              >
                {item.severity}
              </span>
              {expanded ? (
                <ChevronUp className="size-3.5 text-gray-500" />
              ) : (
                <ChevronDown className="size-3.5 text-gray-500" />
              )}
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {expanded ? (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <TreatmentTimelineBody
                item={item}
                notes={notes}
                onBook={onBook}
                onReplace={onReplace}
                onEdit={onEdit}
                onSaveNote={onSaveNote}
                onDelete={onDelete}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.article>
    </div>
  );
}
