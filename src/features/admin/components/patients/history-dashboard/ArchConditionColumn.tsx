"use client";

import { useMemo, useState } from "react";
import { Boxes } from "lucide-react";
import { ConditionList } from "./ConditionList";
import { DentalArchLazy } from "./DentalArchLazy";
import { Dental3DFloatingLazy } from "./dental3d/Dental3DFloatingLazy";
import type { ConditionNode, ToothData } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";
import type { RegisterNodeRef } from "./useNodeRefMap";
import type { ToothConditionInfo } from "./dental3d/dental3d.types";

type Badge = { tooth: number; count: number; glowing: boolean };

const SEVERITY_MAP = {
  LOW: "LOW",
  MED: "MED",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
} as const;

type SeverityKey = keyof typeof SEVERITY_MAP;

type Props = {
  archRef: React.RefObject<HTMLDivElement | null>;
  conditionId: string;
  expandedConditionId: string | null;
  stream: ConditionNode[];
  teeth: ToothData[];
  activeTooth: number;
  hoveredEntity: HoveredEntity;
  registerRef: RegisterNodeRef;
  onCondition: (id: string) => void;
  onCycle: (dir: -1 | 1) => void;
  onSelectTooth: (tooth: number) => void;
  onHoverTooth: (tooth: number | null) => void;
  /** Called when 3D arch tooth is clicked — only highlights, never changes conditions */
  onHighlightTooth: (tooth: number) => void;
};

export function ArchConditionColumn({
  archRef,
  conditionId,
  expandedConditionId,
  stream,
  teeth,
  activeTooth,
  hoveredEntity,
  registerRef,
  onCondition,
  onCycle,
  onSelectTooth,
  onHoverTooth,
  onHighlightTooth,
}: Props) {
  const [show3D, setShow3D] = useState(false);

  const badges: Badge[] = teeth
    .filter((tooth) => tooth.activeAlertCount > 0)
    .map((tooth) => ({
      tooth: tooth.toothNumber,
      count: tooth.activeAlertCount,
      glowing: tooth.glowing,
    }));

  const toothConditions = useMemo((): Record<number, ToothConditionInfo> => {
    const map: Record<number, ToothConditionInfo> = {};
    for (const tooth of teeth) {
      if (tooth.activeAlertCount === 0) continue;
      const worstCond = tooth.conditions.reduce<ConditionNode | null>(
        (best, c) => (!best || c.vitalityIndex !== null ? c : best),
        null,
      );
      const severity = (worstCond?.severity ?? "LOW") as SeverityKey;
      map[tooth.toothNumber] = {
        count: tooth.activeAlertCount,
        severity: SEVERITY_MAP[severity] ?? "LOW",
      };
    }
    return map;
  }, [teeth]);

  return (
    <>
      {/* Classic 2D arch column */}
      <div
        ref={archRef}
        data-anchor="arch"
        className="h-[340px] lg:absolute lg:inset-y-0 lg:start-0 lg:h-auto lg:w-[32%]"
      >
        {/* 3D toggle button */}
        <button
          type="button"
          title={show3D ? "Hide 3D arch" : "Open 3D arch"}
          onClick={() => setShow3D((v) => !v)}
          className={`absolute end-2 top-2 z-20 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow transition ${
            show3D
              ? "bg-[#E2F163] text-[#111111]"
              : "bg-black/20 text-white/80 backdrop-blur-sm hover:bg-black/30"
          }`}
        >
          <Boxes className="size-3" />
          3D
        </button>

        <DentalArchLazy
          activeTooth={activeTooth}
          badges={badges}
          onSelectTooth={onSelectTooth}
          onHoverTooth={onHoverTooth}
        />

        {/* Floating 3D widget — overlaid inside the arch column */}
        {show3D && (
          <Dental3DFloatingLazy
            selectedToothId={activeTooth}
            toothConditions={toothConditions}
            onToothClick={onHighlightTooth}
            onToothHover={onHoverTooth}
            onClose={() => setShow3D(false)}
          />
        )}
      </div>

      <div className="relative z-30 mt-2 lg:absolute lg:top-6 lg:left-[26%] lg:mt-0">
        <ConditionList
          nodes={stream}
          activeId={conditionId}
          expandedId={expandedConditionId}
          hoveredEntity={hoveredEntity}
          registerRef={registerRef}
          onSelect={onCondition}
          onCycle={onCycle}
        />
      </div>
    </>
  );
}
