"use client";

type Props = { hot?: boolean };

export function EndoNoteCard({ hot = false }: Props) {
  return (
    <div
      className={`flex w-[188px] flex-col gap-2 transition-shadow ${hot ? "rounded-[24px] ring-2 ring-[#E2F163]" : ""}`}
      data-anchor="note"
    >
      <article className="rounded-[24px] bg-[#111111] px-4 py-3 text-white shadow-[0_16px_36px_rgba(17,17,17,0.2)]">
        <p className="text-[12px] text-white/70">Office Visit: Endodontic Note</p>
        <p className="mt-2 text-[12px] text-white/90">Root Canal Note - Hospitalization</p>
      </article>
      <article className="rounded-[24px] bg-[#111111] px-4 py-3 text-white shadow-[0_16px_36px_rgba(17,17,17,0.2)]">
        <p className="text-[12px] text-white/70">Office Visit: Endodontic Note</p>
        <p className="mt-2 text-[12px] text-white/90">Post-op observation</p>
      </article>
    </div>
  );
}
