"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ViewSwitcher } from "./ViewSwitcher";
import { ChartingToolbar } from "./ChartingToolbar";
import { DiagnosticCard } from "./DiagnosticCard";
import { DynamicSidebar } from "./DynamicSidebar";
import { fdiFromUniversal, labelForTooth } from "./queueHelpers";
import type { QueueRow, ViewTab } from "./clinicalTypes";
import {
  EMPTY_DIAGNOSTIC,
  type ChartingTool,
  type DentitionMode,
  type DiagnosticStats,
  type NumberingSystem,
  type SidebarView,
} from "./shellTypes";

type Props = {
  children: ReactNode;
  selectedTooth: number | null;
  queue: QueueRow[];
  onPickCdt: (cdtCode: string, label: string) => void;
  onSaveDiagnostic?: (tooth: number, stats: DiagnosticStats) => void;
  onBook?: (id: string) => void;
};

export function PatientDashboardShell({
  children,
  selectedTooth,
  queue,
  onPickCdt,
  onSaveDiagnostic,
  onBook,
}: Props) {
  const [sidebarView, setSidebarView] = useState<SidebarView>("AIAssist");
  const [viewTab, setViewTab] = useState<ViewTab>("chairside");
  const [numbering, setNumbering] = useState<NumberingSystem>("FDI");
  const [dentition, setDentition] = useState<DentitionMode>("Adult");
  const [tool, setTool] = useState<ChartingTool>("Select");
  const [stats, setStats] = useState<DiagnosticStats>(EMPTY_DIAGNOSTIC);

  useEffect(() => {
    setStats(EMPTY_DIAGNOSTIC);
  }, [selectedTooth]);

  const fdi = selectedTooth != null ? fdiFromUniversal(selectedTooth) : null;
  const toothLabel = labelForTooth(selectedTooth, fdi);
  const activeQueue = queue.find(
    (r) =>
      selectedTooth != null &&
      (r.toothFdi === fdi || r.toothLabel.includes(`#${selectedTooth}`)),
  );

  const caseSummary = {
    toothLabel:
      selectedTooth != null ? toothLabel : "Select a tooth for case details",
    progressPercent: activeQueue?.status === "done" ? 100 : activeQueue ? 20 : 0,
    cdtCode: activeQueue?.cdtCode ?? "—",
    urgency: (activeQueue?.severity ?? "Minor") as "Critical" | "Minor",
    feeEgp: activeQueue?.feeAmount ?? 650,
    beforeUrl: activeQueue?.imageUrls[0] ?? null,
    afterUrl: activeQueue?.imageUrls[1] ?? null,
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:p-6">
      <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(300px,400px)]">
        <div className="flex min-h-0 flex-col gap-3">
          <ChartingToolbar
            numbering={numbering}
            dentition={dentition}
            tool={tool}
            onNumbering={setNumbering}
            onDentition={setDentition}
            onTool={setTool}
          />
          <div className="relative min-h-[360px] flex-1 overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white">
            {children}
            {selectedTooth != null ? (
              <DiagnosticCard
                toothLabel={toothLabel}
                stats={stats}
                onChange={setStats}
                onSave={() => {
                  onSaveDiagnostic?.(selectedTooth, stats);
                  setStats(EMPTY_DIAGNOSTIC);
                }}
              />
            ) : null}
          </div>
          <ViewSwitcher active={viewTab} onChange={setViewTab} />
        </div>
        <DynamicSidebar
          sidebarView={sidebarView}
          onSidebarView={setSidebarView}
          queue={queue}
          caseSummary={caseSummary}
          onPickCdt={onPickCdt}
          onBook={onBook}
        />
      </div>
    </div>
  );
}
