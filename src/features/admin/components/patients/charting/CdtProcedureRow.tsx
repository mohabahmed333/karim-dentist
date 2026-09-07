"use client";

import { Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import type { ProcedureItem } from "@/services/cdt";
import { CdtBookingAction } from "./CdtBookingAction";
import { CdtCareToggle } from "./CdtCareToggle";

type Props = {
  procedure: ProcedureItem;
  active: boolean;
  onBook: () => void;
  onAddNote: () => void;
  onToggleCare: () => void;
  onDelete: () => void;
};

export function CdtProcedureRow({
  procedure,
  active,
  onBook,
  onAddNote,
  onToggleCare,
  onDelete,
}: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
    >
      <div
        draggable
        onDragStart={(event) => {
          if ((event.target as HTMLElement).closest("input, button")) {
            event.preventDefault();
            return;
          }
          event.dataTransfer.setData("text/treatment-id", procedure.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        className={`cursor-grab rounded-xl border bg-[#EEF2F6] px-3 py-2.5 ${
          active ? "border-[#2563EB]/40" : "border-[#E2E8F0]"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold tracking-tight text-[#1E293B]">
              {procedure.cdtCode}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-[#64748B]">
              {procedure.description}
            </p>
          </div>
          <CdtCareToggle bucket={procedure.phaseId} onToggle={onToggleCare} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-[#1E293B] ring-1 ring-[#E2E8F0]">
            Tooth {procedure.toothNumber}
          </span>
          <div className="flex items-center gap-1.5">
            <CdtBookingAction procedure={procedure} onBook={onBook} />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onAddNote();
              }}
              className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#475569] ring-1 ring-[#E2E8F0] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
            >
              📝 Add Note
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="rounded p-1 text-[#94A3B8] hover:bg-white hover:text-[#EF4444]"
              aria-label={`Delete ${procedure.cdtCode} on tooth ${procedure.toothNumber}`}
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
