"use client";

import type { ReactNode } from "react";
import { CHAT_BG } from "./chatSkin";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Full-height chat column used by clinic AI and treatment AI. */
export function ChatShell({ children, className = "" }: Props) {
  return (
    <div
      className={`relative flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden ${CHAT_BG} ${className}`}
    >
      {children}
    </div>
  );
}
