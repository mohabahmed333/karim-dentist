"use client";

import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  scale: number;
  onAddNode: () => void;
  onAutoLayout: () => void;
  onReset: () => void;
};

export function CanvasToolbar({ scale, onAddNode, onAutoLayout, onReset }: Props) {
  return (
    <div className="absolute top-3 left-3 right-3 z-40 flex items-center justify-between gap-2">
      <Button
        type="button"
        size="sm"
        className="h-8 rounded-full bg-[#111111] text-white shadow-md hover:bg-[#111111]/90"
        onClick={onAddNode}
      >
        <Plus className="mr-1.5 size-3.5" />
        Add Node
      </Button>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] text-[#111111] shadow-sm">
          {Math.round(scale * 100)}%
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 rounded-full bg-white shadow-md"
          onClick={onAutoLayout}
        >
          Reset Auto-Layout
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="h-8 rounded-full bg-white shadow-md"
          onClick={onReset}
        >
          <RotateCcw className="mr-1.5 size-3.5" />
          Reset scene
        </Button>
      </div>
    </div>
  );
}
