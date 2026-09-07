"use client";

import type { ReactNode } from "react";
import { ScallopEdge } from "./ScallopEdge";

type Props = {
  title: string;
  actions: ReactNode;
  children: ReactNode;
};

export function BentoPanel({ title, actions, children }: Props) {
  return (
    <section className="min-w-0">
      <ScallopEdge />
      <div className="-mt-px rounded-b-[28px] bg-white/40 px-3 pt-1 pb-3">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-medium text-[#111111]">{title}</h2>
          {actions}
        </div>
        {children}
      </div>
    </section>
  );
}

export function CapsuleIcon({ highlight }: { highlight: boolean }) {
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#eceae4]">
      <span className="inline-flex h-4 w-7 overflow-hidden rounded-full">
        <span className={highlight ? "w-1/2 bg-[#E2F163]" : "w-1/2 bg-[#111111]"} />
        <span className="w-1/2 bg-white" />
      </span>
    </span>
  );
}

export function CircleIconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex size-7 items-center justify-center rounded-full bg-[#111111] text-white"
    >
      {children}
    </button>
  );
}
