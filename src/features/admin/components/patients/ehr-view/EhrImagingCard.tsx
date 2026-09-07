"use client";

import Image from "next/image";
import { EHR, type EhrMediaPanel } from "./ehr.types";

export function EhrImagingCard({ panels }: { panels: EhrMediaPanel[] }) {
  return (
    <div
      className="w-full max-w-[220px] overflow-hidden rounded-2xl border p-2.5"
      style={{ background: EHR.card, borderColor: EHR.border }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 px-0.5">
        <span
          className="text-[10px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: EHR.muted }}
        >
          Imaging · {panels.length}
        </span>
        <span className="text-[10px]" style={{ color: EHR.muted }}>
          {panels[0]?.dateLabel}
        </span>
      </div>
      <div
        className={`grid gap-1.5 ${panels.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
      >
        {panels.map((panel, i) => (
          <figure key={panel.id} className="min-w-0">
            <div
              className="relative aspect-[5/4] w-full overflow-hidden rounded-lg"
              style={{ background: EHR.soft }}
            >
              {panel.urls[0] ? (
                <Image
                  src={panel.urls[0]}
                  alt={panel.label}
                  fill
                  className="object-contain"
                  sizes="220px"
                />
              ) : null}
            </div>
            <figcaption
              className="mt-1 text-[10px] font-semibold tracking-[0.1em] uppercase"
              style={{ color: EHR.muted }}
            >
              {panels.length === 2
                ? i === 0
                  ? "Before"
                  : "After"
                : panel.label}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
