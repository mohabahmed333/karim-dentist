"use client";

import { useState } from "react";
import { PanelRightClose } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { SupportDetailsTabs } from "./SupportDetailsTabs";
import {
  SupportConversationMeta,
  type StaffOption,
} from "./SupportConversationMeta";
import type {
  SupportConversation,
  SupportDetails,
  SupportMessage,
} from "./supportDummyData";

type Props = {
  details: SupportDetails;
  messages: SupportMessage[];
  conversationId?: string;
  /** Show the live AI assistant controls (real Kapso conversations only). */
  showAiControls?: boolean;
  onToggleDetails: () => void;
  onAddNote?: (body: string) => void | Promise<void>;
  onTogglePinNote?: (id: string, pinned: boolean) => void | Promise<void>;
  onEditNote?: (id: string, body: string) => void | Promise<void>;
  onDeleteNote?: (id: string) => void | Promise<void>;
  /** Tags/assignee editor, real WhatsApp conversations only. */
  conversation?: SupportConversation;
  staffOptions?: StaffOption[];
  onTagsChange?: (tags: string[]) => void;
  onAssigneeChange?: (
    assigneeId: string | null,
    assigneeName: string | null,
  ) => void;
};

export function SupportDetailsColumn({
  details,
  messages,
  conversationId,
  showAiControls,
  onToggleDetails,
  onAddNote,
  onTogglePinNote,
  onEditNote,
  onDeleteNote,
  conversation,
  staffOptions,
  onTagsChange,
  onAssigneeChange,
}: Props) {
  const t = useTranslations();
  const [open, setOpen] = useState<Record<string, boolean>>({
    ai: true,
    attributes: true,
    client: true,
    tickets: true,
    notes: true,
  });

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-s border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--admin-border)] px-4 py-3">
        <h2 className="text-sm font-semibold text-[var(--admin-text)]">
          {t("admin.frontDesk.patientDetails")}
        </h2>
        <button
          type="button"
          onClick={onToggleDetails}
          className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
          aria-label={t("admin.frontDesk.hideDetails")}
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </header>
      {conversation && staffOptions && onTagsChange && onAssigneeChange ? (
        <SupportConversationMeta
          conversation={conversation}
          staffOptions={staffOptions}
          onTagsChange={onTagsChange}
          onAssigneeChange={onAssigneeChange}
        />
      ) : null}
      <SupportDetailsTabs
        details={details}
        messages={messages}
        conversationId={conversationId}
        showAiControls={showAiControls}
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
