"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { CaretStepper } from "./CaretStepper";
import { ApexLocatorCard } from "./ApexLocatorCard";
import { CONDITION_LABELS } from "@/services/dental_chart/labels";
import { SOURCE_NODE_ID } from "@/services/dental_chart/graph-network";
import type { ConditionNode } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";
import type { RegisterNodeRef } from "./useNodeRefMap";

type PillProps = {
  node: ConditionNode;
  active: boolean;
  hovered: boolean;
  expanded: boolean;
  onSelect: (id: string) => void;
};

function ConditionPill({ node, active, hovered, expanded, onSelect }: PillProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`flex w-[228px] items-center gap-2 rounded-full py-1.5 pe-3 ps-1.5 text-start shadow-[0_10px_24px_rgba(17,17,17,0.08)] transition-all duration-200 ${
        hovered ? "bg-[#E2F163]/35 ring-2 ring-[#E2F163]" : "bg-white"
      }`}
    >
      {active ? (
        <span className="hx-badge-glow flex size-8 items-center justify-center rounded-full bg-[#E2F163]">
          <span className="size-2 rounded-full bg-[#111111]" />
        </span>
      ) : (
        <span className="flex size-8 items-center justify-center">
          <span className="size-2 rounded-full bg-[#111111]" />
        </span>
      )}
      <span className="text-[13px] font-medium text-[#111111]">
        {CONDITION_LABELS[node.type]}
      </span>
      {active ? (expanded ? <ChevronUp className="ms-auto size-3.5" /> : <ChevronDown className="ms-auto size-3.5" />) : null}
    </button>
  );
}

type ListProps = {
  nodes: ConditionNode[];
  activeId: string;
  expandedId: string | null;
  hoveredEntity: HoveredEntity;
  registerRef: RegisterNodeRef;
  onSelect: (id: string) => void;
  onCycle: (dir: -1 | 1) => void;
};

export function ConditionList({
  nodes,
  activeId,
  expandedId,
  hoveredEntity,
  registerRef,
  onSelect,
  onCycle,
}: ListProps) {
  return (
    <div className="hx-condition-stack flex flex-col items-start gap-2">
      {nodes.map((node) => {
        const active = node.id === activeId;
        const expanded = node.id === expandedId;
        const hovered =
          hoveredEntity?.type === "NODE" && hoveredEntity.id === node.id;
        return (
          <div key={node.id} className="flex flex-col items-start gap-2">
            <div data-anchor={`fan-${node.id}`} className="flex items-center gap-1.5">
              <div
                ref={active && expanded ? registerRef(SOURCE_NODE_ID) : undefined}
                data-anchor={active && expanded ? "condition" : undefined}
                className="flex items-center gap-1.5"
              >
                <ConditionPill
                  node={node}
                  active={active}
                  hovered={hovered}
                  expanded={expanded}
                  onSelect={onSelect}
                />
                {active && expanded ? (
                  <CaretStepper onPrev={() => onCycle(-1)} onNext={() => onCycle(1)} />
                ) : null}
              </div>
            </div>
            {active && expanded && node.type === "ENDODONTIC_INFECTION" ? (
              <div className="ms-9 origin-top animate-in fade-in duration-200">
                <ApexLocatorCard />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
