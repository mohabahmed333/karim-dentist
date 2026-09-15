"use client";

import type { ReactNode } from "react";
import type { CdtPhase } from "@/services/cdt";
import type { Service } from "@/services/services/types";
import type { DiagTab } from "./useChartingSession";
import { ProcedureBuilderDrawer } from "./ProcedureBuilderDrawer";
import { ToothInspectorDrawer } from "./ToothInspectorDrawer";

type Props = {
  inspectorOpen: boolean;
  onCloseInspector: () => void;
  builderOpen: boolean;
  onCloseBuilder: () => void;
  selectedFdi: string | null;
  toothLabel: string;
  toothShort: string | null;
  diagTab: DiagTab;
  onDiagTab: (tab: DiagTab) => void;
  diagnosticBody: ReactNode;
  services: Service[];
  onAddProcedure: (service: Service, phase: CdtPhase) => void;
};

export function ChartingDrawers({
  inspectorOpen,
  onCloseInspector,
  builderOpen,
  onCloseBuilder,
  selectedFdi,
  toothLabel,
  toothShort,
  diagTab,
  onDiagTab,
  diagnosticBody,
  services,
  onAddProcedure,
}: Props) {
  return (
    <>
      <ToothInspectorDrawer
        open={inspectorOpen}
        onClose={onCloseInspector}
        selectedFdi={selectedFdi}
        toothLabel={toothLabel}
        tab={diagTab}
        onTab={onDiagTab}
      >
        {diagnosticBody}
      </ToothInspectorDrawer>
      <ProcedureBuilderDrawer
        open={builderOpen}
        onClose={onCloseBuilder}
        toothLabel={toothShort}
        hasTooth={Boolean(selectedFdi)}
        services={services}
        onAdd={onAddProcedure}
      />
    </>
  );
}
