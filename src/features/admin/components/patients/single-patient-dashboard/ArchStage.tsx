"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { AnatomicalArchViewer } from "../shared/anatomical-arch";
import { ViewSwitcher } from "./ViewSwitcher";
import { fdiFromUniversal } from "./queueHelpers";
import type { ViewTab } from "./clinicalTypes";

type Props = {
  selectedUniversal: number | null;
  markedFdis: string[];
  viewTab: ViewTab;
  onViewTab: (tab: ViewTab) => void;
  onSelectUniversal: (universal: number) => void;
};

export function ArchStage({
  selectedUniversal,
  markedFdis,
  viewTab,
  onViewTab,
  onSelectUniversal,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const selectedFdi =
    selectedUniversal != null ? fdiFromUniversal(selectedUniversal) : null;

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="relative aspect-[4/3] w-full min-h-[320px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <AnatomicalArchViewer
          selectedFdi={selectedFdi}
          markedFdis={markedFdis}
          highlightColor="#2563eb"
          focusMode
          flipped={flipped}
          onSelectUniversal={onSelectUniversal}
          cameraZ={6.4}
          className="absolute inset-0 h-full w-full"
        />
        <button
          type="button"
          onClick={() => setFlipped((v) => !v)}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:text-slate-900"
          aria-label="Flip arch view"
        >
          <ArrowLeftRight className="size-3.5" />
          Flip
        </button>
      </div>
      <ViewSwitcher active={viewTab} onChange={onViewTab} />
    </section>
  );
}
