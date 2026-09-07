"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  /** Panel width / layout classes */
  panelClassName?: string;
  align?: "start" | "end";
  labelledBy?: string;
};

/** Shared click-outside + Escape popover used by Customize toolbar menus. */
export function CustomizeToolbarMenu({
  open,
  onOpenChange,
  trigger,
  children,
  panelClassName = "w-[min(280px,calc(100vw-1.5rem))]",
  align = "start",
  labelledBy,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (rootRef.current?.contains(event.target)) return;
      onOpenChange(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="relative">
      {trigger}
      {open ? (
        <div
          role="dialog"
          aria-labelledby={labelledBy}
          className={[
            "absolute top-[calc(100%+6px)] z-[520] overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.18)]",
            align === "end" ? "end-0" : "start-0",
            panelClassName,
          ].join(" ")}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
