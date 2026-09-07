"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  count?: number | string;
  action?: ReactNode;
  children?: ReactNode;
};

export function EditorSectionHeader({ title, count, action }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 px-0.5">
      <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
        {title}
        {count != null ? (
          <span className="ms-1.5 tabular-nums text-[#b0b0b0]">{count}</span>
        ) : null}
      </h2>
      {action}
    </div>
  );
}

export function EditorFieldCard({
  children,
  fill = false,
}: {
  children: ReactNode;
  fill?: boolean;
}) {
  return (
    <div
      className={
        fill
          ? "flex flex-1 flex-col space-y-2 rounded-[8px] border border-[#ebebeb] bg-[#fafafa] p-2.5"
          : "space-y-2 rounded-[8px] border border-[#ebebeb] bg-[#fafafa] p-2.5"
      }
    >
      {children}
    </div>
  );
}

export function EditorListFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-[#ebebeb] bg-white">
      {children}
    </div>
  );
}
