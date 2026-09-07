"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CdtPhase, ProcedureItem } from "@/services/cdt";
import { CdtPhaseStack } from "./CdtPhaseStack";
import { usePhaseOpen } from "./usePhaseOpen";

type Props = {
  phase: CdtPhase;
  title: string;
  items: ProcedureItem[];
  selectedTooth: string | null;
  onBook: (id: string) => void;
  onAddNote: (id: string) => void;
  onToggleCare: (id: string) => void;
  onDelete: (id: string) => void;
  onDropPhase: (id: string, phase: CdtPhase) => void;
};

export function CdtPhaseLane({
  phase,
  title,
  items,
  selectedTooth,
  onBook,
  onAddNote,
  onToggleCare,
  onDelete,
  onDropPhase,
}: Props) {
  const { open, setOpen } = usePhaseOpen(items.length);

  return (
    <div
      className="rounded-xl border border-[#E2E8F0] bg-[#F8F9FA]"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const id = event.dataTransfer.getData("text/treatment-id");
        if (!id) return;
        setOpen(true);
        onDropPhase(id, phase);
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2"
      >
        <span className="text-start text-[12px] font-semibold text-[#1E293B]">
          {open ? "▾" : "▸"} {title}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
            items.length === 0
              ? "bg-[#EEF2F6] text-[#94A3B8]"
              : "bg-[#EFF6FF] text-[#2563EB]"
          }`}
        >
          {items.length === 0 ? "Empty" : items.length}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2">
              <CdtPhaseStack
                items={items}
                selectedTooth={selectedTooth}
                onBook={onBook}
                onAddNote={onAddNote}
                onToggleCare={onToggleCare}
                onDelete={onDelete}
              />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
