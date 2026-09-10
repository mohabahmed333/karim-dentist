"use client";

import { FileText } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { SupportAccordion, SupportKeyValueList } from "./SupportAccordion";
import { SupportAiControlPanel } from "./SupportAiControlPanel";
import { SupportNotesPanel } from "./SupportNotesPanel";
import type { SupportDetails } from "./supportDummyData";

type Props = {
  details: SupportDetails;
  conversationId?: string;
  showAiControls?: boolean;
  open: Record<string, boolean>;
  onToggle: (key: string) => void;
  onAddNote?: (body: string) => void | Promise<void>;
  onTogglePinNote?: (id: string, pinned: boolean) => void | Promise<void>;
  onEditNote?: (id: string, body: string) => void | Promise<void>;
  onDeleteNote?: (id: string) => void | Promise<void>;
};

export function SupportDetailsSections({
  details,
  conversationId,
  showAiControls,
  open,
  onToggle,
  onAddNote,
  onTogglePinNote,
  onEditNote,
  onDeleteNote,
}: Props) {
  const t = useTranslations();

  return (
    <>
      {showAiControls && conversationId ? (
        <SupportAccordion
          title={t("admin.frontDesk.aiControlTitle")}
          open={open.ai}
          onToggle={() => onToggle("ai")}
        >
          <SupportAiControlPanel conversationId={conversationId} />
        </SupportAccordion>
      ) : null}

      <SupportAccordion
        title={t("admin.frontDesk.visitAttributes")}
        open={open.attributes}
        onToggle={() => onToggle("attributes")}
      >
        <SupportKeyValueList items={details.attributes} />
      </SupportAccordion>

      <SupportAccordion
        title={t("admin.frontDesk.patientData")}
        open={open.client}
        onToggle={() => onToggle("client")}
      >
        <SupportKeyValueList items={details.clientData} />
      </SupportAccordion>

      <SupportAccordion
        title={t("admin.frontDesk.linkedVisits")}
        badge={details.tickets.length}
        open={open.tickets}
        onToggle={() => onToggle("tickets")}
      >
        <div className="space-y-2">
          {details.tickets.length === 0 ? (
            <p className="text-xs text-[#9CA3AF]">
              {t("admin.frontDesk.noVisits")}
            </p>
          ) : null}
          {details.tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex items-start gap-2 rounded-md border border-[#E5E7EB] p-2"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#FEE2E2] text-[#DC2626]">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-[#111827]">
                  {ticket.title}
                </p>
                <p className="text-[11px] text-[#6B7280]">{ticket.creator}</p>
              </div>
              <span className="shrink-0 rounded bg-[#F3F4F6] px-1.5 py-0.5 text-[10px] font-medium text-[#374151]">
                {ticket.status}
              </span>
            </div>
          ))}
        </div>
      </SupportAccordion>

      <SupportAccordion
        title={t("admin.frontDesk.notes")}
        badge={details.notes.length}
        open={open.notes}
        onToggle={() => onToggle("notes")}
      >
        <SupportNotesPanel
          notes={details.notes}
          onAdd={onAddNote}
          onTogglePin={onTogglePinNote}
          onEdit={onEditNote}
          onDelete={onDeleteNote}
        />
      </SupportAccordion>
    </>
  );
}
