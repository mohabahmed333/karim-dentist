"use client";

import { forwardRef } from "react";

type Props = {
  label: string;
  width: number;
  height: number;
};

/** Floating card; parent sets `transform` on the node for smooth follow. */
export const DashboardDragGhost = forwardRef<HTMLDivElement, Props>(
  function DashboardDragGhost({ label, width, height }, ref) {
    return (
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[200] overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-xl ring-2 ring-[var(--admin-primary)] will-change-transform"
        style={{
          width,
          height,
          opacity: 0.92,
          transform: "translate(-9999px, -9999px)",
        }}
      >
        <div className="flex h-9 items-center border-b border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 text-[12px] font-semibold text-[var(--admin-text)]">
          {label}
        </div>
        <div className="h-[calc(100%-2.25rem)] bg-[var(--admin-canvas)]/80" />
      </div>
    );
  },
);
