"use client";

import type { GraphAnchor } from "@/services/dental_chart";

type Props = {
  anchor: GraphAnchor;
  title: string;
  date: string;
  hot?: boolean;
  onHover: (id: string | null) => void;
};

export function WhitePillCard({ anchor, title, date, hot = false, onHover }: Props) {
  return (
    <article
      data-anchor={anchor}
      onMouseEnter={() => onHover(anchor)}
      onMouseLeave={() => onHover(null)}
      className={`rounded-[22px] bg-white px-4 py-3 shadow-[0_12px_28px_rgba(17,17,17,0.08)] transition-shadow ${
        hot ? "ring-2 ring-[#E2F163]" : ""
      }`}
    >
      <p className="text-[12px] leading-snug text-[#111111]">{title}</p>
      <span className="mt-3 inline-flex rounded-full bg-[#EBEAE5] px-2.5 py-0.5 text-[11px] text-[#111111]">
        {date}
      </span>
    </article>
  );
}
