"use client";

import { GitBranch, CircleDot } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CanvasNode } from "./canvas.types";
import { getShapeDefinition } from "./shapeRegistry";
import { ShapeExamplePreview } from "./ShapeExamplePreview";

type Props = {
  value: string | null;
  nodes: CanvasNode[];
  onChange: (parentId: string | null) => void;
};

export function ParentNodeSelect({ value, nodes, onChange }: Props) {
  const selectedNode = nodes.find((node) => node.id === value);
  const selectedShape = selectedNode ? getShapeDefinition(selectedNode.shapeType) : null;

  return (
    <Select
      value={value ?? "none"}
      onValueChange={(next) => onChange(next === "none" ? null : next)}
    >
      <SelectTrigger className="h-auto min-h-11 w-full rounded-2xl border-[#111111]/10 bg-white px-3 py-2 shadow-sm">
        {selectedNode ? (
          <span className="flex flex-1 items-center gap-2 overflow-hidden text-left">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E2F163]/30">
              <GitBranch className="size-3.5 text-[#111111]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-start gap-3">
                <span className="-mt-0.5 flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-[#EBEAE5]/60">
                  <ShapeExamplePreview
                    shapeType={selectedNode.shapeType}
                    title={selectedNode.title}
                    data={selectedNode.data}
                    scale={0.26}
                    compact
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium text-[#111111]">
                    {selectedNode.title}
                  </span>
                  <span className="block truncate text-[10px] text-[#111111]/50">
                    {selectedShape?.label ?? selectedNode.shapeType}
                  </span>
                </span>
              </span>
            </span>
          </span>
        ) : value === null ? (
          <span className="flex flex-1 items-center gap-2 text-left">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#EBEAE5]">
              <CircleDot className="size-3.5 text-[#111111]/60" />
            </span>
            <span>
              <span className="block text-[12px] font-medium text-[#111111]">Free-floating node</span>
              <span className="block text-[10px] text-[#111111]/50">No parent connection</span>
            </span>
          </span>
        ) : (
          <SelectValue placeholder="Choose parent node…" />
        )}
      </SelectTrigger>
      <SelectContent className="z-(--z-popover) rounded-2xl border-[#111111]/10 p-1 shadow-xl">
        <SelectItem value="none" className="rounded-xl py-2.5">
          <span className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-[#EBEAE5]">
              <CircleDot className="size-3.5 text-[#111111]/60" />
            </span>
            <span>
              <span className="block text-[12px] font-medium">Free-floating node</span>
              <span className="block text-[10px] text-[#111111]/50">No parent connection</span>
            </span>
          </span>
        </SelectItem>
        {nodes.map((node) => {
          const shape = getShapeDefinition(node.shapeType);
          return (
            <SelectItem key={node.id} value={node.id} className="rounded-xl py-2.5">
              <span className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E2F163]/30">
                  <GitBranch className="size-3.5 text-[#111111]" />
                </span>
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-[#EBEAE5]/60">
                  <ShapeExamplePreview
                    shapeType={node.shapeType}
                    title={node.title}
                    data={node.data}
                    scale={0.26}
                    compact
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[12px] font-medium">{node.title}</span>
                  <span className="block truncate text-[10px] text-[#111111]/50">
                    {shape?.label ?? node.shapeType}
                  </span>
                </span>
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
