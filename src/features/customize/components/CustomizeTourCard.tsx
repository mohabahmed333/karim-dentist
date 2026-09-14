"use client";

import { Button } from "@/components/ui/button";
import type { CSSProperties } from "react";

type Props = {
  stepIndex: number;
  stepCount: number;
  title: string;
  body: string;
  style: CSSProperties;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
};

export function CustomizeTourCard({
  stepIndex,
  stepCount,
  title,
  body,
  style,
  onBack,
  onNext,
  onSkip,
}: Props) {
  const last = stepIndex >= stepCount - 1;
  return (
    <div
      className="pointer-events-auto fixed z-[510] w-[min(340px,calc(100vw-2rem))] rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4 text-[var(--admin-text)] shadow-[0_16px_48px_rgba(0,0,0,0.28)]"
      style={style}
      data-tour-card=""
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-muted)]">
        {stepIndex + 1} / {stepCount}
      </p>
      <h2 className="mt-1 text-sm font-semibold text-[var(--admin-text)]">{title}</h2>
      <p className="mt-1.5 text-[12px] leading-relaxed text-[var(--admin-muted)]">{body}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          className="h-8 px-2 text-xs text-[var(--admin-text)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          onClick={onSkip}
        >
          Exit
        </Button>
        <div className="flex gap-1.5">
          <Button
            type="button"
            variant="outline"
            className="h-8 border-[var(--admin-text)] bg-[var(--admin-text)] px-2.5 text-xs text-[var(--admin-panel)] hover:opacity-90"
            disabled={stepIndex === 0}
            onClick={onBack}
          >
            Back
          </Button>
          <Button
            type="button"
            className="h-8 bg-[var(--admin-text)] px-2.5 text-xs text-[var(--admin-panel)] hover:opacity-90"
            onClick={onNext}
          >
            {last ? "Done" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
