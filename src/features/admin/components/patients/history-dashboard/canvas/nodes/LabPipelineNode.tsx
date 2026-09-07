"use client";

type Props = { title: string; progressPercent?: number };

const STAGES = ["Impression", "Design", "Mill", "Stain", "Ship"];

export function LabPipelineNode({ title, progressPercent = 83 }: Props) {
  const activeIndex = Math.min(STAGES.length - 1, Math.floor((progressPercent / 100) * STAGES.length));
  return (
    <article className="w-[220px] rounded-2xl bg-[#111111] p-4 text-white shadow-xl">
      <p className="text-[11px] text-white/70">{title}</p>
      <p className="mt-2 text-[13px] font-medium text-[#E2F163]">{progressPercent}% Complete</p>
      <div className="mt-3 flex items-center gap-1.5">
        {STAGES.map((stage, index) => (
          <div key={stage} className="flex flex-1 flex-col items-center gap-1">
            <span
              className={`block rounded-full ${
                index <= activeIndex
                  ? index === activeIndex
                    ? "size-3 bg-[#E2F163]"
                    : "size-2.5 bg-[#E2F163]/70"
                  : "size-1.5 bg-white/25"
              }`}
            />
            <span className="text-[7px] text-white/40">{stage.slice(0, 3)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
