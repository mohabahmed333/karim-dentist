"use client";

import { useState } from "react";
import { PanelRightClose } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { SupportDetailsTabs } from "./SupportDetailsTabs";
import type { SupportDetails, SupportMessage } from "./supportDummyData";

type Props = {
  details: SupportDetails;
  messages: SupportMessage[];
  onToggleDetails: () => void;
  onAddNote?: (body: string) => void | Promise<void>;
  onTogglePinNote?: (id: string, pinned: boolean) => void | Promise<void>;
  onEditNote?: (id: string, body: string) => void | Promise<void>;
  onDeleteNote?: (id: string) => void | Promise<void>;
};

export function SupportDetailsColumn({
  details,
  messages,
  onToggleDetails,
  onAddNote,
  onTogglePinNote,
  onEditNote,
  onDeleteNote,
}: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState<Record<string, boolean>>({
    attributes: true,
    client: true,
    tickets: true,
    notes: true,
  });

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-s border-[#E5E7EB] bg-white">
      <header className="flex shrink-0 items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#111827]">
          {t("admin.frontDesk.patientDetails")}
        </h2>
        <button
          type="button"
          onClick={onToggleDetails}
          className="rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6]"
          aria-label={t("admin.frontDesk.hideDetails")}
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </header>
      <SupportDetailsTabs
        details={details}
        messages={messages}
        accordionOpen={open}
        onToggleAccordion={(key) =>
          setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onAddNote={onAddNote}
        onTogglePinNote={onTogglePinNote}
        onEditNote={onEditNote}
        onDeleteNote={onDeleteNote}
      />
    </aside>
  );
}
