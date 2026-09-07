"use client";

import dynamic from "next/dynamic";

const Canvas = dynamic(
  () => import("./AnatomicalArchCanvas").then((m) => m.AnatomicalArchCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[240px] items-center justify-center text-[11px] text-[#64748B]">
        Loading arch…
      </div>
    ),
  },
);

type Props = {
  selectedFdi: string | null;
  markedFdis?: string[];
  highlightColor?: string;
  focusMode?: boolean;
  flipped?: boolean;
  onSelectFdi?: (fdi: string) => void;
  onSelectUniversal?: (universal: number) => void;
  className?: string;
  cameraZ?: number;
};

/** Shared anatomical mouth viewer for Clinical + Charting. */
export function AnatomicalArchViewer(props: Props) {
  return <Canvas {...props} />;
}
