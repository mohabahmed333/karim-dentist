"use client";

import { Button } from "@/components/ui/button";
import type {
  CollectionRowDragHandleProps,
  CollectionRowDragItemProps,
} from "./collectionListRowTypes";

type Props = {
  index: number;
  total: number;
  label: string;
  hidden?: boolean;
  active: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  dragHandleProps?: CollectionRowDragHandleProps;
  dragItemProps?: CollectionRowDragItemProps;
  onSelect: () => void;
  onMove: (direction: "up" | "down") => void;
};

export function BuilderSectionRow({
  index,
  total,
  label,
  hidden,
  active,
  dragging = false,
  dropTarget = false,
  dragHandleProps,
  dragItemProps,
  onSelect,
  onMove,
}: Props) {
  const rowClass = [
    "group flex items-center gap-0.5 px-1.5 py-1",
    dragging
      ? "bg-[#e8e8e8] text-[#1a1a1a]"
      : active
        ? "bg-[#1a1a1a] text-white"
        : "bg-white hover:bg-[#f6f6f6]",
    dropTarget ? "ring-1 ring-inset ring-[#6cb6ff]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleTone = dragging
    ? "cursor-grabbing text-[#1a1a1a]"
    : active
      ? "cursor-grab text-white/70 active:cursor-grabbing"
      : "cursor-grab text-[#b0b0b0] hover:text-[#1a1a1a] active:cursor-grabbing";

  return (
    <div className={rowClass} data-sortable-row="" {...dragItemProps}>
      <button
        type="button"
        aria-label="Drag to reorder"
        title="Drag to reorder"
        className={`h-7 w-5 shrink-0 text-[11px] tracking-tighter ${handleTone}`}
        {...dragHandleProps}
      >
        ⋮⋮
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 truncate px-0.5 text-start text-[12px] leading-5 font-medium"
        onClick={onSelect}
      >
        {index + 1}. {label}
        {hidden ? (
          <span
            className={
              active ? "ms-1.5 text-[10px] text-white/55" : "ms-1.5 text-[10px] text-[#8a8a8a]"
            }
          >
            hidden
          </span>
        ) : null}
      </button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={
          active
            ? "h-7 w-6 rounded-[4px] px-0 text-[11px] text-white/75 hover:bg-white/15 hover:text-white"
            : "h-7 w-6 rounded-[4px] px-0 text-[11px] text-[#6b6b6b]"
        }
        disabled={index === 0}
        onClick={() => onMove("up")}
      >
        ↑
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={
          active
            ? "h-7 w-6 rounded-[4px] px-0 text-[11px] text-white/75 hover:bg-white/15 hover:text-white"
            : "h-7 w-6 rounded-[4px] px-0 text-[11px] text-[#6b6b6b]"
        }
        disabled={index === total - 1}
        onClick={() => onMove("down")}
      >
        ↓
      </Button>
    </div>
  );
}
