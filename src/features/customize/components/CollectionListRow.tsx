"use client";

import { CollectionRowActions } from "./CollectionRowActions";
import type { CollectionListRowProps } from "./collectionListRowTypes";

export function CollectionListRow({
  label,
  year,
  active,
  isFirst,
  isLast,
  locked = false,
  dragging = false,
  dropTarget = false,
  dragDisabled = false,
  dragHandleProps,
  dragItemProps,
  onMoveUp,
  onMoveDown,
  onDelete,
  onSelect,
}: CollectionListRowProps) {
  if (locked) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5 text-[#8a8a8a]">
        <span className="min-w-0 flex-1 truncate text-start text-[12px] font-medium">
          {label}
        </span>
      </div>
    );
  }

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
        disabled={dragDisabled}
        {...dragHandleProps}
      >
        ⋮⋮
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 truncate px-0.5 text-start text-[12px] leading-5"
      >
        <span className="font-medium">{label}</span>
        {year ? (
          <span
            className={
              dragging || !active
                ? "ms-1.5 text-[10px] tabular-nums text-[#8a8a8a]"
                : "ms-1.5 text-[10px] tabular-nums text-white/55"
            }
          >
            {year}
          </span>
        ) : null}
      </button>
      <CollectionRowActions
        active={active}
        isFirst={isFirst}
        isLast={isLast}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDelete={onDelete}
      />
    </div>
  );
}
