"use client";

import dynamic from "next/dynamic";

export const DentalArchLazy = dynamic(
  () => import("./DentalArchCanvas").then((mod) => mod.DentalArchCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center text-[11px] tracking-[0.2em] text-[#8a8a8a] uppercase">
        Loading arch
      </div>
    ),
  },
);
