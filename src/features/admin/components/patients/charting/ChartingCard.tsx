"use client";

import type { ReactNode } from "react";
import { CHART_CARD } from "./chartingSkin";

type Props = {
  tour: "chart" | "diagnostics" | "planner";
  ring: string;
  children: ReactNode;
};

export function ChartingCard({ tour, ring, children }: Props) {
  return (
    <div className={`${ring} ${CHART_CARD}`} data-tour={tour}>
      {children}
    </div>
  );
}
