"use client";

import dynamic from "next/dynamic";
import type { Dental3DModelProps } from "./dental3d.types";

export const Dental3DLazy = dynamic(
  () => import("./Dental3DModel").then((m) => m.Dental3DModel),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center text-[11px] tracking-[0.2em] text-[#8a8a8a] uppercase">
        Loading 3D arch
      </div>
    ),
  },
) as React.ComponentType<Dental3DModelProps>;
