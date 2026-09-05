"use client";

import { useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { AnatomicalArchViewer } from "../shared/anatomical-arch";
import { fdiFromUniversal } from "./queueHelpers";

type Props = {
  selectedUniversal: number | null;
  markedFdis: string[];
  onSelectUniversal: (universal: number) => void;
};

/** 3D arch viewport for PatientDashboardShell left column. */
export function ArchStage({
  selectedUniversal,
  markedFdis,
  onSelectUniversal,
}: Props) {
  const [flipped, setFlipped] = useState(false);
  const selectedFdi =
    selectedUniversal != null ? fdiFromUniversal(selectedUniversal) : null;

  return (
    <div className="relative h-full min-h-[360px] w-full bg-[#f8fafc]">
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
        className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-white/95 px-2.5 py-1.5 text-[11px] font-medium text-[#6b7280] shadow-sm hover:text-[#111827]"
        aria-label="Flip arch view"
      >
        <ArrowLeftRight className="size-3.5" />
        Flip
      </button>
    </div>
  );
}
