"use client";

import { Loader2Icon } from "lucide-react";
import { cmsTranslateSelectionLabel } from "../lib/collectCmsTranslateJobs";
import { useCmsTranslate } from "./CmsTranslateProvider";

export function CustomizeTranslateOverlay() {
  const { isTranslating, progress } = useCmsTranslate();
  if (!isTranslating || !progress) return null;

  const scopeLabel = cmsTranslateSelectionLabel(progress.selection);
  const label =
    progress.direction === "to-ar"
      ? `Translating ${scopeLabel} to Arabic…`
      : `Translating ${scopeLabel} to English…`;
  const percent =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : 0;

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-white/70 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <div className="mx-4 w-full max-w-sm rounded-[12px] border border-[#e5e5e5] bg-white p-5 shadow-[0_16px_48px_rgba(0,0,0,0.16)]">
        <div className="flex items-center gap-3">
          <Loader2Icon
            className="size-5 shrink-0 animate-spin text-[#1a1a1a]"
            aria-hidden
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#1a1a1a]">{label}</p>
            <p className="mt-0.5 text-[12px] text-[#6b6b6b]">
              {progress.done} of {progress.total} fields · Please wait
            </p>
          </div>
        </div>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f0f0f0]">
          <div
            className="h-full rounded-full bg-[#1a1a1a] transition-[width] duration-200"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
