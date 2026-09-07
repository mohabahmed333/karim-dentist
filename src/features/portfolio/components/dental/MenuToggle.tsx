"use client";

import { cn } from "@/lib/utils";

type MenuToggleProps = {
  expanded: boolean;
  onClick: () => void;
  ariaLabel: string;
  className?: string;
};

export function MenuToggle({
  expanded,
  onClick,
  ariaLabel,
  className,
}: MenuToggleProps) {
  return (
    <button
      type="button"
      data-menu-toggle
      className={cn(
        "inline-grid size-[46px] place-items-center rounded-full border border-[#e6e8ec] bg-transparent p-0 text-[#0f2744]",
        className,
      )}
      aria-expanded={expanded}
      aria-controls="site-menu"
      aria-label={ariaLabel}
      onClick={onClick}
    >
      <span className="relative block h-[1.5px] w-4 rounded-full bg-current">
        <span className="absolute start-0 top-[-5px] block h-[1.5px] w-4 rounded-full bg-current" />
        <span className="absolute start-0 top-[5px] block h-[1.5px] w-[11px] rounded-full bg-current" />
      </span>
    </button>
  );
}
