"use client";

import { createPortal } from "react-dom";
import type { SortableDragGhostState } from "./SortableDragGhost";

type Props = {
  ghost: SortableDragGhostState | null;
};

/** Floating clone that follows the cursor while reordering lists. */
export function SortableDragGhostLayer({ ghost }: Props) {
  if (!ghost || typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-hidden
      className="sortable-drag-ghost pointer-events-none fixed z-[200] overflow-hidden rounded-[4px] border border-[#c8c8c8] bg-[#e8e8e8] text-[#1a1a1a] shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
      style={{
        left: ghost.x - ghost.offsetX,
        top: ghost.y - ghost.offsetY,
        width: ghost.width,
        height: ghost.height,
      }}
      dangerouslySetInnerHTML={{ __html: ghost.html }}
    />,
    document.body,
  );
}
