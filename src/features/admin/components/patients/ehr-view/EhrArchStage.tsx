"use client";

import { ArrowLeftRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AnatomicalArchViewer } from "../shared/anatomical-arch";
import { ADMIN_THEME_EVENT } from "@/features/admin/lib/adminThemeEvent";
import { EHR, type EhrCondition, UNIVERSAL_TO_FDI } from "./ehr.types";

type Props = {
  conditions: EhrCondition[];
  active: EhrCondition | null;
  selectedToothId: number | null;
  flipped: boolean;
  onFlip: () => void;
  onSelectTooth: (universal: number) => void;
  /** Fill parent height instead of square aspect. */
  fill?: boolean;
};

function readAdminPrimary(): string {
  if (typeof window === "undefined") return "#5e6ad2";
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue("--admin-primary")
    .trim();
  return value || "#5e6ad2";
}

export function EhrArchStage({
  conditions,
  active,
  selectedToothId,
  flipped,
  onFlip,
  onSelectTooth,
  fill = false,
}: Props) {
  const [highlight, setHighlight] = useState(readAdminPrimary);
  const focusId = selectedToothId ?? active?.toothUniversal ?? null;
  const selectedFdi =
    active?.fdi ??
    (focusId != null ? UNIVERSAL_TO_FDI[focusId] ?? null : null);
  const markedFdis = [
    ...new Set(
      conditions
        .map((c) => c.fdi)
        .filter((fdi): fdi is string => Boolean(fdi)),
    ),
  ];

  useEffect(() => {
    function sync() {
      setHighlight(readAdminPrimary());
    }
    sync();
    window.addEventListener(ADMIN_THEME_EVENT, sync);
    return () => window.removeEventListener(ADMIN_THEME_EVENT, sync);
  }, []);

  return (
    <div className="relative flex h-full w-full min-h-0 flex-col">
      <div
        className={
          fill
            ? "relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-canvas)]"
            : "relative aspect-square w-full min-h-[360px] overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-canvas)]"
        }
      >
        <AnatomicalArchViewer
          selectedFdi={selectedFdi}
          markedFdis={markedFdis}
          highlightColor={highlight}
          focusMode
          flipped={flipped}
          onSelectUniversal={onSelectTooth}
          cameraZ={fill ? 5.8 : 6.4}
          className="absolute inset-0 h-full w-full"
        />
      </div>
      <div className="mt-2 flex shrink-0 items-center justify-between gap-2">
        <p
          className="min-h-[16px] text-[11px] font-medium tabular-nums"
          style={{ color: EHR.ink }}
        >
          {active?.fdi
            ? `Tooth #${active.fdi}`
            : focusId != null
              ? `Tooth #${focusId}`
              : "Select a tooth"}
        </p>
        <button
          type="button"
          onClick={onFlip}
          aria-label="Flip arch direction"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: "var(--admin-primary)" }}
        >
          <ArrowLeftRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
