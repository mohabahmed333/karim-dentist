"use client";

type Drug = { name: string; timing: "day" | "night" | "both" };

type Props = { title: string; drugs?: Drug[] };

function timingIcon(timing: Drug["timing"]) {
  if (timing === "night") return "🌙";
  if (timing === "both") return "☀️🌙";
  return "☀️";
}

export function PrescriptionListNode({
  title,
  drugs = [
    { name: "Amoxicillin 500mg", timing: "day" },
    { name: "Ibuprofen 600mg", timing: "both" },
  ],
}: Props) {
  return (
    <article className="w-[240px] rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
      <p className="text-[11px] font-medium text-[#111111]/60">{title}</p>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {drugs.map((drug) => (
          <div
            key={drug.name}
            className="min-w-[108px] rounded-xl bg-[#EBEAE5] px-2.5 py-2 text-[#111111]"
          >
            <p className="text-[10px] leading-snug font-medium">{drug.name}</p>
            <span className="mt-1 block text-[11px]">{timingIcon(drug.timing)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}
