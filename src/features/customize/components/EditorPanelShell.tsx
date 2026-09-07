"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Consistent vertical rhythm for Customize sidebar panels. */
export function EditorPanelShell({ children, className }: Props) {
  return (
    <div
      data-tour="section-panel"
      className={
        className
          ? `flex flex-col gap-3 ${className}`
          : "flex flex-col gap-3"
      }
    >
      {children}
    </div>
  );
}
