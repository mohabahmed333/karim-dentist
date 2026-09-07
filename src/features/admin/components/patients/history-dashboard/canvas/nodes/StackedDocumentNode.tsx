"use client";

export function StackedDocumentNode() {
  return (
    <div className="relative w-[200px]">
      <article className="relative z-10 rounded-3xl bg-[#111111] px-4 py-3 text-white shadow-xl">
        <p className="text-[12px] text-white/70">Office Visit: Endodontic Note</p>
        <p className="mt-2 text-[12px] text-white/90">Root Canal Note - Hospitalization</p>
      </article>
      <article className="absolute top-8 -right-2 z-20 w-[82%] rounded-2xl bg-[#111111]/95 px-3.5 py-2.5 text-white shadow-xl">
        <p className="pr-8 text-[11px] text-white/75">Root Canal Hospitalization Note</p>
        <span className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-full bg-[#E2F163] text-[10px] font-semibold text-[#111111]">
          2.01
        </span>
      </article>
    </div>
  );
}
