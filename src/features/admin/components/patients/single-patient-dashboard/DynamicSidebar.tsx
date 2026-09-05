"use client";

import { AiAssistPanel } from "./AiAssistPanel";
import { CaseDetailsPanel } from "./CaseDetailsPanel";
import { QueuePanel } from "./QueuePanel";
import { SIDEBAR_VIEWS, type SidebarView } from "./shellTypes";
import type { QueueRow } from "./clinicalTypes";

type CaseSummary = {
  toothLabel: string;
  progressPercent: number;
  cdtCode: string;
  urgency: "Critical" | "Minor";
  feeEgp: number;
  beforeUrl?: string | null;
  afterUrl?: string | null;
};

type Props = {
  sidebarView: SidebarView;
  onSidebarView: (view: SidebarView) => void;
  queue: QueueRow[];
  caseSummary: CaseSummary;
  onPickCdt: (cdtCode: string, label: string) => void;
  onBook?: (id: string) => void;
};

export function DynamicSidebar({
  sidebarView,
  onSidebarView,
  queue,
  caseSummary,
  onPickCdt,
  onBook,
}: Props) {
  return (
    <aside className="flex h-full min-h-[420px] flex-col rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <div
        role="tablist"
        aria-label="Sidebar views"
        className="mb-4 flex gap-1 rounded-full border border-[#e5e7eb] bg-[#f8fafc] p-1"
      >
        {SIDEBAR_VIEWS.map((tab) => {
          const active = tab.id === sidebarView;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSidebarView(tab.id)}
              className={`flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors ${
                active
                  ? "bg-[#2563eb] text-white"
                  : "text-[#6b7280] hover:text-[#111827]"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {sidebarView === "AIAssist" ? (
          <AiAssistPanel onPickCdt={onPickCdt} />
        ) : null}
        {sidebarView === "CaseDetails" ? (
          <CaseDetailsPanel {...caseSummary} />
        ) : null}
        {sidebarView === "Queue" ? (
          <QueuePanel rows={queue} onBook={onBook} />
        ) : null}
      </div>
    </aside>
  );
}
