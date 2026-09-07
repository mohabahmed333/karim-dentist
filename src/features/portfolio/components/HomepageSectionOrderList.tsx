"use client";

import {
  HOMEPAGE_SECTION_LABELS,
  isHomepageSectionHidden,
  type HomepageSectionKey,
  type HideableSectionKey,
} from "@/features/portfolio/lib/homepageSectionOrder";

type DragHandleProps = Record<string, unknown>;
type DragItemProps = Record<string, unknown>;

type Props = {
  order: HomepageSectionKey[];
  hidden?: string[];
  onToggleHidden?: (key: HideableSectionKey) => void;
  getHandleProps: (index: number) => DragHandleProps;
  getItemProps: (index: number) => DragItemProps;
  overIndex: number | null;
  draggingIndex: number | null;
  tone?: "light" | "admin";
};

export function HomepageSectionOrderList({
  order,
  hidden = [],
  onToggleHidden,
  getHandleProps,
  getItemProps,
  overIndex,
  draggingIndex,
  tone = "light",
}: Props) {
  const isAdmin = tone === "admin";

  return (
    <ul className="space-y-1">
      {order.map((key, index) => {
        const dragging = draggingIndex === index;
        const dropTarget = overIndex === index && draggingIndex !== index;
        const isHidden = isHomepageSectionHidden(hidden, key);
        const row = isAdmin
          ? [
              "flex items-center gap-2 rounded-md border border-border bg-background px-2 py-2",
              dragging ? "opacity-60" : "",
              dropTarget ? "ring-2 ring-ring" : "",
              isHidden ? "opacity-50" : "",
            ]
          : [
              "group flex items-center gap-0.5 rounded-[6px] px-1.5 py-1",
              dragging ? "bg-[#e8e8e8]" : "bg-white hover:bg-[#f6f6f6]",
              dropTarget ? "ring-1 ring-inset ring-[#6cb6ff]" : "",
              isHidden ? "opacity-50" : "",
            ];

        return (
          <li
            key={key}
            className={row.filter(Boolean).join(" ")}
            data-sortable-row=""
            {...getItemProps(index)}
          >
            <button
              type="button"
              aria-label={`Drag ${HOMEPAGE_SECTION_LABELS[key]}`}
              title="Drag to reorder"
              className={
                isAdmin
                  ? "h-8 w-6 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
                  : "h-7 w-5 shrink-0 cursor-grab text-[11px] tracking-tighter text-[#b0b0b0] hover:text-[#1a1a1a] active:cursor-grabbing"
              }
              {...getHandleProps(index)}
            >
              ⋮⋮
            </button>
            <span
              className={
                isAdmin
                  ? "min-w-0 flex-1 text-sm font-medium"
                  : "min-w-0 flex-1 truncate px-0.5 text-[12px] leading-5 font-medium text-[#1a1a1a]"
              }
            >
              {index + 1}. {HOMEPAGE_SECTION_LABELS[key]}
            </span>
            {onToggleHidden ? (
              <button
                type="button"
                aria-label={isHidden ? `Show ${HOMEPAGE_SECTION_LABELS[key]}` : `Hide ${HOMEPAGE_SECTION_LABELS[key]}`}
                title={isHidden ? "Show section" : "Hide section"}
                className={
                  isAdmin
                    ? "shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                    : "shrink-0 rounded-[4px] px-1.5 py-0.5 text-[11px] text-[#8a8a8a] hover:bg-[#ececec] hover:text-[#1a1a1a]"
                }
                onClick={() => onToggleHidden(key)}
              >
                {isHidden ? "Show" : "Hide"}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
