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
      <div className="flex items-center gap-1 px-2 py-1.5 text-[var(--admin-muted)]">
        <span className="min-w-0 flex-1 truncate text-start text-[12px] font-medium">
          {label}
        </span>
      </div>
    );
  }

  const rowClass = [
    "group flex items-center gap-0.5 px-1.5 py-1",
    dragging
      ? "bg-[var(--admin-hover)] text-[var(--admin-text)]"
      : active
        ? "bg-[#1a1a1a] text-white"
        : "bg-[var(--admin-panel)] hover:bg-[var(--admin-hover)]",
    dropTarget ? "ring-1 ring-inset ring-[#6cb6ff]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleTone = dragging
    ? "cursor-grabbing text-[var(--admin-text)]"
    : active
      ? "cursor-grab text-white/70 active:cursor-grabbing"
      : "cursor-grab text-[var(--admin-muted)] hover:text-[var(--admin-text)] active:cursor-grabbing";

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
                ? "ms-1.5 text-[10px] tabular-nums text-[var(--admin-muted)]"
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
