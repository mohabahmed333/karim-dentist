"use client";

import { useMemo, useRef } from "react";
import { ArchConditionColumn } from "./ArchConditionColumn";
import { CbctViewerModal } from "./CbctViewerModal";
import { NodeGraphCanvas } from "./canvas/NodeGraphCanvas";
import { FanRayLayer } from "./FanRayLayer";
import { GraphCardsMobile } from "./GraphCardsMobile";
import { useStageMeasure } from "./useStageMeasure";
import { useNodeRefMap } from "./useNodeRefMap";
import { CONDITION_LABELS } from "@/services/dental_chart/labels";
import type { ConditionType, GraphAnchor, ConditionNode, ToothData } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";

type Props = {
  conditionId: string;
  conditionType: ConditionType;
  expandedConditionId: string | null;
  stream: ConditionNode[];
  teeth: ToothData[];
  activeTooth: number;
  anchors: GraphAnchor[];
  hoveredEntity: HoveredEntity;
  archRef: React.RefObject<HTMLDivElement | null>;
  cbctOpen: boolean;
  onCondition: (id: string) => void;
  onCycle: (dir: -1 | 1) => void;
  onSelectTooth: (tooth: number) => void;
  onHoverTooth: (tooth: number | null) => void;
  onHighlightTooth: (tooth: number) => void;
  onCbctOpen: (open: boolean) => void;
};

export function OverviewStage({
  conditionId,
  conditionType,
  expandedConditionId,
  stream,
  teeth,
  activeTooth,
  hoveredEntity,
  archRef,
  cbctOpen,
  onCondition,
  onCycle,
  onSelectTooth,
  onHoverTooth,
  onHighlightTooth,
  onCbctOpen,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const { nodeRefs, setNodeRef } = useNodeRefMap();
  const measured = useStageMeasure(
    stageRef,
    `${conditionId}-${expandedConditionId}`,
  );

  const conditionTitle = useMemo(
    () => CONDITION_LABELS[conditionType],
    [conditionType],
  );

  return (
    <div ref={stageRef} className="relative mt-1 min-h-[340px] lg:min-h-[680px]">
      <FanRayLayer
        rects={measured.rects}
        width={measured.width}
        height={measured.height}
        stream={stream}
        conditionId={conditionId}
        hoveredEntity={hoveredEntity}
      />
      <div className="relative z-20 min-h-[340px] lg:min-h-[680px]">
        <ArchConditionColumn
          archRef={archRef}
          conditionId={conditionId}
          expandedConditionId={expandedConditionId}
          stream={stream}
          teeth={teeth}
          activeTooth={activeTooth}
          hoveredEntity={hoveredEntity}
          registerRef={setNodeRef}
          onCondition={onCondition}
          onCycle={onCycle}
          onSelectTooth={onSelectTooth}
          onHoverTooth={onHoverTooth}
          onHighlightTooth={onHighlightTooth}
        />
        <div className="lg:absolute lg:inset-y-0 lg:end-0 lg:left-[36%] lg:ps-2">
          <NodeGraphCanvas
            conditionTitle={conditionTitle}
            onOpenCbct={() => onCbctOpen(true)}
          />
          <GraphCardsMobile />
        </div>
      </div>
      <CbctViewerModal open={cbctOpen} onOpenChange={onCbctOpen} />
    </div>
  );
}
