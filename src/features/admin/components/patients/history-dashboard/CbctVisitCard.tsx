"use client";

import { CbctSlice } from "./CbctSlice";

type Props = {
  hot?: boolean;
  onOpen: () => void;
  onHover: (id: string | null) => void;
};

export function CbctVisitCard({ hot = false, onOpen, onHover }: Props) {
  return (
    <article
      data-anchor="cbct"
      onMouseEnter={() => onHover("cbct")}
      onMouseLeave={() => onHover(null)}
      className={`w-full cursor-pointer rounded-[28px] bg-[#111111] p-3 text-white shadow-[0_20px_44px_rgba(17,17,17,0.24)] transition-shadow ${
        hot ? "ring-2 ring-[#E2F163]" : ""
      }`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen();
      }}
      role="button"
      tabIndex={0}
    >
      <p className="px-2 pt-1 text-[12px] text-white/70">
        Office Visit: Tooth #14 CBCT Scan
      </p>
      <div className="mt-3 grid grid-cols-2 gap-1.5 overflow-hidden rounded-2xl">
        {([0, 1, 2, 3] as const).map((variant) => (
          <div key={variant} className="aspect-square">
            <CbctSlice variant={variant} />
          </div>
        ))}
      </div>
    </article>
  );
}
