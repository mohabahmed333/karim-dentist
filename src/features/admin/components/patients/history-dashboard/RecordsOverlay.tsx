"use client";

import type { ReactNode } from "react";
import { PATIENT_PANEL } from "../patientSkin";
import type { RecordsPane } from "./recordsPane";

type Props = {
  pane: RecordsPane | null;
  children: ReactNode;
};

export function RecordsOverlay({ pane, children }: Props) {
  if (!pane) return null;

  return (
    <div className="absolute inset-x-0 top-14 bottom-[4.75rem] z-30 flex flex-col px-0 md:top-12">
      <div
        className={`flex min-h-0 flex-1 flex-col overflow-hidden ${PATIENT_PANEL} shadow-lg`}
      >
        <div
          className={`flex min-h-0 flex-1 flex-col ${
            pane === "clinical"
              ? "overflow-hidden p-2 sm:p-3"
              : "overflow-y-auto p-4"
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
