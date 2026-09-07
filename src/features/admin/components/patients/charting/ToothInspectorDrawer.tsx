"use client";

import type { ReactNode } from "react";
import { SideDrawer } from "../treatments/SideDrawer";
import type { DiagTab } from "./useChartingSession";
import { DiagnosticPane } from "./DiagnosticPane";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedFdi: string | null;
  toothLabel: string;
  tab: DiagTab;
  onTab: (tab: DiagTab) => void;
  children: ReactNode;
};

export function ToothInspectorDrawer({
  open,
  onClose,
  selectedFdi,
  toothLabel,
  tab,
  onTab,
  children,
}: Props) {
  return (
    <SideDrawer
      open={open && Boolean(selectedFdi)}
      title={toothLabel || "Tooth inspector"}
      onClose={onClose}
    >
      <div className="flex h-full min-h-0 flex-col px-5 pb-5">
        <DiagnosticPane
          selectedFdi={selectedFdi}
          toothLabel={toothLabel}
          tab={tab}
          onTab={onTab}
        >
          {children}
        </DiagnosticPane>
      </div>
    </SideDrawer>
  );
}
