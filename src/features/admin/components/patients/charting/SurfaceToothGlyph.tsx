"use client";

import {
  chartToothKind,
  chartToothName,
  CHART_CROWN_WIDTH,
  displayTooth,
  mesialOnRight,
  type NotationSystem,
} from "@/services/notation";
import {
  emptySurfaces,
  type PaintTool,
  type SurfaceId,
  type SurfaceMap,
} from "@/services/tooth_surfaces";
import { SurfacePaintCell } from "./SurfacePaintCell";
import { SurfaceToothOutline } from "./SurfaceToothOutline";

const FILL: Record<string, string> = {
  unmarked: "#ffffff",
  decay: "#EF4444",
  filling: "#3B82F6",
};

type Props = {
  fdi: string;
  notation: NotationSystem;
  selected: boolean;
  surfaces: SurfaceMap;
  tool: PaintTool;
  onSelect: (fdi: string) => void;
  onPaint: (fdi: string, surface: SurfaceId) => void;
};

export function SurfaceToothGlyph({
  fdi,
  notation,
  selected,
  surfaces,
  tool,
  onSelect,
  onPaint,
}: Props) {
  const map = surfaces ?? emptySurfaces();
  const locked = map.whole !== "none";
  const decayed = [map.facial, map.occlusal, map.mesial, map.distal, map.lingual].includes(
    "decay",
  );
  const missing = map.whole === "missing";
  const crown = map.whole === "crown";
  const kind = chartToothKind(fdi);
  const flip = mesialOnRight(fdi);
  const left: SurfaceId = flip ? "distal" : "mesial";
  const right: SurfaceId = flip ? "mesial" : "distal";
  const paint = (surface: SurfaceId) => {
    if (tool === "select") onSelect(fdi);
    else onPaint(fdi, surface);
  };
  const cell = (surface: SurfaceId) => (
    <SurfacePaintCell
      status={map[surface]}
      disabled={locked}
      onClick={() => paint(surface)}
      label={`${fdi} ${surface}`}
      fill={FILL[map[surface]] ?? "#ffffff"}
    />
  );

  return (
    <div
      className={`flex ${CHART_CROWN_WIDTH[kind]} flex-col items-center gap-0.5 ${
        selected ? "rounded-lg ring-2 ring-[#2563EB] ring-offset-1" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSelect(fdi)}
        className={`relative text-[10px] font-semibold ${
          selected ? "text-[#2563EB]" : "text-[#64748B]"
        }`}
        aria-label={chartToothName(fdi)}
      >
        {displayTooth(fdi, notation)}
        {decayed ? (
          <span className="absolute -end-1 top-0 h-1.5 w-1.5 rounded-full bg-[#EF4444]" />
        ) : null}
      </button>
      <div className="relative h-[3.6rem] w-full">
        <SurfaceToothOutline
          kind={kind}
          crown={crown}
          missing={missing}
          selected={selected}
          uid={fdi}
        />
        <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 place-items-center px-1 py-1.5">
          <span />
          {cell("facial")}
          <span />
          {cell(left)}
          {cell("occlusal")}
          {cell(right)}
          <span />
          {cell("lingual")}
          <span />
        </div>
        {missing ? (
          <span className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center text-sm font-bold text-[#6b7280]">
            X
          </span>
        ) : null}
      </div>
    </div>
  );
}
