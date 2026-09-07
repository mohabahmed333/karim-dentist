"use client";

import { useCallback, useRef, useState } from "react";
import type { ConditionNode } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";

type Args = {
  stream: ConditionNode[];
  setSelectedConditionId: (id: string) => void;
  setSelectedToothId: (id: number | null) => void;
};

function primaryForTooth(nodes: ConditionNode[], tooth: number): string | null {
  const onTooth = nodes.filter((node) => node.toothNumber === tooth);
  const endo = onTooth.find((node) => node.type === "ENDODONTIC_INFECTION");
  return endo?.id ?? onTooth[0]?.id ?? null;
}

export function useDashboardInteractions({
  stream,
  setSelectedConditionId,
  setSelectedToothId,
}: Args) {
  const archRef = useRef<HTMLDivElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<HoveredEntity>(null);
  const [expandedConditionId, setExpandedConditionId] = useState<string | null>("cond-endo");
  const [cbctOpen, setCbctOpen] = useState(false);

  const onHoverTooth = useCallback((tooth: number | null) => {
    if (tooth === null) {
      setHoveredEntity(null);
      return;
    }
    const nodeId = primaryForTooth(stream, tooth);
    setHoveredEntity(
      nodeId ? { type: "NODE", id: nodeId } : { type: "TOOTH", id: String(tooth) },
    );
  }, [stream]);

  const onFocusTooth = useCallback(
    (tooth: number) => {
      setSelectedToothId(tooth);
      const nodeId = primaryForTooth(stream, tooth);
      if (nodeId) {
        setSelectedConditionId(nodeId);
        setExpandedConditionId(nodeId);
      }
      archRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [setSelectedConditionId, setSelectedToothId, stream],
  );

  /** Highlight a tooth in the 3D view only — does NOT change active condition or canvas nodes */
  const onHighlightTooth = useCallback(
    (tooth: number) => {
      setSelectedToothId(tooth);
    },
    [setSelectedToothId],
  );

  const onSelectCondition = useCallback(
    (id: string) => {
      setSelectedConditionId(id);
      setExpandedConditionId(id);
    },
    [setSelectedConditionId],
  );

  return {
    archRef,
    hoveredEntity,
    expandedConditionId,
    setExpandedConditionId,
    cbctOpen,
    setCbctOpen,
    onHoverTooth,
    onFocusTooth,
    onHighlightTooth,
    onSelectCondition,
    setHoveredEntity,
  };
}
