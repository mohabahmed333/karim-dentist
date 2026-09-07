"use client";

import type { RefObject } from "react";
import { ScanLine } from "lucide-react";
import { BentoPanel } from "./BentoPanel";
import { VisitFilterMenu } from "./VisitFilterMenu";
import { visitChipDate, visitTitle } from "./bento-format";
import type { Encounter } from "@/services/dental_chart";
import type { VisitCategory } from "@/services/dental_chart/bento";

type Props = {
  encounters: Encounter[];
  activeId: string | null;
  scrollRef: RefObject<HTMLDivElement | null>;
  visitCategories: VisitCategory[];
  onVisitCategories: (categories: VisitCategory[]) => void;
  onSelect: (encounter: Encounter) => void;
};

export function VisitsRail({
  encounters,
  activeId,
  scrollRef,
  visitCategories,
  onVisitCategories,
  onSelect,
}: Props) {
  return (
    <BentoPanel
      title="Visits"
      actions={<VisitFilterMenu selected={visitCategories} onChange={onVisitCategories} />}
    >
      <div ref={scrollRef} className="hx-bento-scroll flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
        {encounters.map((visit) => {
          const active = visit.id === activeId;
          return (
            <article key={visit.id} data-visit-id={visit.id} className="min-w-[168px] snap-start">
              <p className="mb-1 text-center text-[11px] text-[#7a7a7a]">
                {visitChipDate(visit.timestamp)}
              </p>
              <button
                type="button"
                onClick={() => onSelect(visit)}
                className={
                  active
                    ? "w-full rounded-[22px] bg-[#E2F163] px-3 py-3 text-start"
                    : "w-full rounded-[22px] bg-[#d8d6cf] px-3 py-3 text-start"
                }
              >
                {active ? <ScanLine className="mb-1 size-3.5 text-[#111111]" /> : null}
                <p className="text-[12px] leading-snug font-medium text-[#111111]">
                  {visitChipDate(visit.timestamp)} — {visitTitle(visit)}
                </p>
              </button>
            </article>
          );
        })}
      </div>
    </BentoPanel>
  );
}
