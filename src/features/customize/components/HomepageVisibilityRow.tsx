"use client";

import {
  HOMEPAGE_SECTION_LABELS,
  isHomepageSectionHidden,
  type HomepageSectionKey,
} from "@/features/portfolio/lib/homepageSectionOrder";
import { VisibilitySwitch } from "./VisibilitySwitch";
import type { useSortableListDrag } from "./useSortableListDrag";

type DragApi = ReturnType<typeof useSortableListDrag>;

type Props = {
  sectionKey: HomepageSectionKey;
  index: number;
  hidden: string[];
  drag: DragApi;
  onToggle: () => void;
};

export function HomepageVisibilityRow({
  sectionKey,
  index,
  hidden,
  drag,
  onToggle,
}: Props) {
  const isHidden = isHomepageSectionHidden(hidden, sectionKey);
  const dragging = drag.draggingIndex === index;
  const dropTarget = drag.overIndex === index && drag.draggingIndex !== index;
  const label = HOMEPAGE_SECTION_LABELS[sectionKey];

  return (
    <li
      className={[
        "flex items-center gap-2 border-b border-[var(--admin-border)] px-2 py-2.5 last:border-b-0",
        dragging ? "bg-[var(--admin-hover)] opacity-70" : "",
        dropTarget ? "ring-1 ring-inset ring-[#6cb6ff]" : "",
        isHidden ? "opacity-60" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-sortable-row=""
      {...drag.getItemProps(index)}
    >
      <button
        type="button"
        aria-label={`Drag ${label}`}
        title="Drag to reorder"
        className="h-7 w-5 shrink-0 cursor-grab text-[11px] tracking-tighter text-[var(--admin-muted)] hover:text-[var(--admin-text)] active:cursor-grabbing"
        {...drag.getHandleProps(index)}
      >
        ⋮⋮
      </button>
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--admin-text)]">
        {label}
      </span>
      <VisibilitySwitch on={!isHidden} label={label} onToggle={onToggle} />
    </li>
  );
}
