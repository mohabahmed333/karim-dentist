"use client";

import { AnimatePresence } from "framer-motion";
import type { ProcedureItem } from "@/services/cdt";
import { CdtProcedureRow } from "./CdtProcedureRow";

type Props = {
  items: ProcedureItem[];
  selectedTooth: string | null;
  onBook: (id: string) => void;
  onAddNote: (id: string) => void;
  onToggleCare: (id: string) => void;
  onDelete: (id: string) => void;
};

export function CdtPhaseStack({
  items,
  selectedTooth,
  onBook,
  onAddNote,
  onToggleCare,
  onDelete,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="py-3 text-center text-[11px] text-[#94A3B8]">
        Drop a procedure here, or tap a preset above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <CdtProcedureRow
            key={item.id}
            procedure={item}
            active={item.toothNumber === selectedTooth}
            onBook={() => onBook(item.id)}
            onAddNote={() => onAddNote(item.id)}
            onToggleCare={() => onToggleCare(item.id)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
