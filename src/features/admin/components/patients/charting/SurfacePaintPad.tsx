"use client";

import {
  chartToothKind,
  chartToothName,
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

type Props = {
  fdi: string;
  notation: NotationSystem;
  surfaces: SurfaceMap;
  tool: PaintTool;
  onPaint: (fdi: string, surface: SurfaceId) => void;
};

/** Compact 5-surface paint pad for the tooth inspector (3D chart mode). */
export function SurfacePaintPad({
  fdi,
  notation,
  surfaces,
  tool,
  onPaint,
}: Props) {
  const map = surfaces ?? emptySurfaces();
  const locked = map.whole !== "none";
  const kind = chartToothKind(fdi);
  const flip = mesialOnRight(fdi);
  const left: SurfaceId = flip ? "distal" : "mesial";
  const right: SurfaceId = flip ? "mesial" : "distal";
  const fill: Record<string, string> = {
    unmarked: "#ffffff",
    decay: "#EF4444",
    filling: "#3B82F6",
  };
  const cell = (surface: SurfaceId) => (
    <SurfacePaintCell
      status={map[surface]}
      disabled={locked || tool === "select"}
      onClick={() => onPaint(fdi, surface)}
      label={`${fdi} ${surface}`}
      fill={fill[map[surface]] ?? "#ffffff"}
    />
  );

  return (
    <div className="mb-3 rounded-xl border border-[#E2E8F0] bg-[#F8F9FA] p-3">
      <p className="mb-2 text-[11px] font-semibold text-[#1E293B]">
        Surfaces · {displayTooth(fdi, notation)} · {chartToothName(fdi)}
      </p>
      <div className="relative mx-auto h-16 w-14">
        <SurfaceToothOutline
          kind={kind}
          crown={map.whole === "crown"}
          missing={map.whole === "missing"}
          selected
          uid={`pad-${fdi}`}
        />
        <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3 place-items-center py-1">
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
      </div>
      {tool === "select" ? (
        <p className="mt-2 text-[10px] text-[#64748B]">
          Choose Decay / Filling / Crown / Missing in the toolbar to paint.
        </p>
      ) : null}
    </div>
  );
}
