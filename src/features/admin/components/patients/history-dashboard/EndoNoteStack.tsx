"use client";

import type { RegisterNodeRef } from "./useNodeRefMap";

type Props = {
  hot?: boolean;
  registerRef: RegisterNodeRef;
  onHover: (id: string | null) => void;
};

export function EndoNoteStack({ hot = false, registerRef, onHover }: Props) {
  return (
    <div
      className={`relative w-full ${hot ? "rounded-[24px] ring-2 ring-[#E2F163]" : ""}`}
      onMouseEnter={() => onHover("note")}
      onMouseLeave={() => onHover(null)}
    >
      <article
        ref={registerRef("card-endo-note")}
        data-anchor="note"
        className="relative z-10 rounded-[24px] bg-[#111111] px-4 py-3 text-white shadow-[0_16px_36px_rgba(17,17,17,0.2)]"
      >
        <p className="text-[12px] text-white/70">Office Visit: Endodontic Note</p>
        <p className="mt-2 text-[12px] text-white/90">Root Canal Note - Hospitalization</p>
      </article>
      <article
        ref={registerRef("card-hospital")}
        data-anchor="hospital"
        className="absolute top-8 -end-2 z-20 w-[82%] rounded-[22px] bg-[#111111]/95 px-3.5 py-2.5 text-white shadow-[0_14px_30px_rgba(17,17,17,0.28)]"
      >
        <p className="pe-8 text-[11px] text-white/75">Root Canal Hospitalization Note</p>
        <span className="absolute top-2 end-2 flex size-8 items-center justify-center rounded-full bg-[#E2F163] text-[10px] font-semibold text-[#111111]">
          2.01
        </span>
      </article>
    </div>
  );
}
