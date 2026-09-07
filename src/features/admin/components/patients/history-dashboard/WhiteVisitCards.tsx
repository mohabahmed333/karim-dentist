"use client";

type Props = { hot?: boolean };

export function PerioVisitCard({ hot = false }: Props) {
  return (
    <article
      data-anchor="perio"
      className={`w-[168px] rounded-[22px] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(17,17,17,0.08)] transition-shadow ${
        hot ? "ring-2 ring-[#E2F163]" : ""
      }`}
    >
      <p className="text-[12px] leading-snug text-[#111111]">
        Office Visit: Perio Probing Depth
      </p>
      <span className="mt-3 inline-flex rounded-full bg-[#EBEAE5] px-2.5 py-0.5 text-[11px] text-[#111111]">
        07.10
      </span>
    </article>
  );
}

export function LabResultChip({
  anchor,
  date,
  hot = false,
  onHover,
}: {
  anchor: "lab-a" | "lab-b";
  date: string;
  hot?: boolean;
  onHover: (id: string | null) => void;
}) {
  return (
    <article
      data-anchor={anchor}
      onMouseEnter={() => onHover(anchor)}
      onMouseLeave={() => onHover(null)}
      className={`w-[150px] rounded-[20px] bg-white px-3.5 py-3 shadow-[0_10px_24px_rgba(17,17,17,0.07)] transition-shadow ${
        hot ? "ring-2 ring-[#E2F163]" : ""
      }`}
    >
      <p className="text-[11px] leading-snug text-[#111111]">Office Visit: Lab Results</p>
      <span className="mt-2 inline-block text-[11px] text-[#7a7a7a]">{date}</span>
    </article>
  );
}
