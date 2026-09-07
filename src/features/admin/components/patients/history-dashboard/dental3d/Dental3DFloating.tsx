"use client";

import { useRef, useState } from "react";
import { GripHorizontal, Maximize2, Minimize2, X } from "lucide-react";
import { Dental2DArch } from "./Dental2DArch";
import type { ToothConditionInfo } from "./dental3d.types";

type Props = {
  selectedToothId: number | null;
  toothConditions?: Record<number, ToothConditionInfo>;
  highlightColor?: string;
  onToothClick: (id: number) => void;
  onToothHover?: (id: number | null) => void;
  onClose: () => void;
};

const SIZES = {
  sm: { w: 256, h: 210 },
  lg: { w: 380, h: 310 },
};

export function Dental3DFloating({
  selectedToothId,
  toothConditions = {},
  highlightColor = "#E2F163",
  onToothClick,
  onToothHover,
  onClose,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const { w, h } = expanded ? SIZES.lg : SIZES.sm;

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const [pos, setPos] = useState({ x: 8, y: 8 });

  function onGripDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
  }
  function onGripMove(e: React.PointerEvent) {
    if (!dragOrigin.current) return;
    const dx = e.clientX - dragOrigin.current.mx;
    const dy = e.clientY - dragOrigin.current.my;
    setPos({ x: dragOrigin.current.px + dx, y: dragOrigin.current.py + dy });
  }
  function onGripUp(e: React.PointerEvent) {
    dragOrigin.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: w,
        zIndex: 40,
        transition: "width 0.2s, height 0.2s",
      }}
      className="overflow-hidden rounded-2xl border border-white/20 bg-[#EBEAE5] shadow-2xl"
    >
      {/* Header drag strip */}
      <div
        className="flex cursor-grab items-center justify-between bg-[#111111]/80 px-2 py-1.5 active:cursor-grabbing"
        onPointerDown={onGripDown}
        onPointerMove={onGripMove}
        onPointerUp={onGripUp}
      >
        <GripHorizontal className="size-3.5 text-white/40" />
        <span className="text-[10px] font-semibold tracking-wider text-white/60 uppercase">
          {selectedToothId !== null ? `Tooth #${selectedToothId}` : "Arch Chart"}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex size-5 items-center justify-center rounded text-white/50 hover:text-white"
          >
            {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-5 items-center justify-center rounded text-white/50 hover:text-[#E2F163]"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      {/* 2D SVG arch */}
      <div style={{ height: h }} className="p-1">
        <Dental2DArch
          selectedToothId={selectedToothId}
          toothConditions={toothConditions}
          highlightColor={highlightColor}
          onToothClick={onToothClick}
          onToothHover={onToothHover}
        />
      </div>
    </div>
  );
}
