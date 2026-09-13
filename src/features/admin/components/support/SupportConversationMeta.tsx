"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { SupportTag } from "./SupportTag";
import type { SupportConversation } from "./supportDummyData";

const BUILTIN_TAG_LABELS = new Set([
  "WhatsApp",
  "Patient",
  "Ended",
  "Archived",
  "Demo",
]);

export type StaffOption = { id: string; name: string };

type Props = {
  conversation: SupportConversation;
  staffOptions: StaffOption[];
  onTagsChange: (tags: string[]) => void;
  onAssigneeChange: (
    assigneeId: string | null,
    assigneeName: string | null,
  ) => void;
};

export function SupportConversationMeta({
  conversation,
  staffOptions,
  onTagsChange,
  onAssigneeChange,
}: Props) {
  const t = useTranslations();
  const [draft, setDraft] = useState("");
  const customTags = conversation.tags
    .map((tag) => tag.label)
    .filter((label) => !BUILTIN_TAG_LABELS.has(label));

  function addTag() {
    const value = draft.trim();
    if (!value || customTags.includes(value)) {
      setDraft("");
      return;
    }
    onTagsChange([...customTags, value]);
    setDraft("");
  }

  function removeTag(label: string) {
    onTagsChange(customTags.filter((t) => t !== label));
  }

  return (
    <div className="space-y-3 border-b border-[var(--admin-border)] px-4 py-3">
      <div>
        <p className="mb-1.5 text-xs font-semibold text-[var(--admin-muted)]">
          {t("admin.frontDesk.tagsLabel")}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {customTags.map((label) => (
            <span key={label} className="inline-flex items-center gap-1">
              <SupportTag label={label} />
              <button
                type="button"
                onClick={() => removeTag(label)}
                aria-label={t("admin.frontDesk.removeTag")}
                className="text-[var(--admin-muted)] hover:text-[var(--admin-text)]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder={t("admin.frontDesk.addTag")}
            className="min-w-[80px] flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-xs text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)] focus:border-[var(--admin-border)]"
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-[var(--admin-muted)]">
          {t("admin.frontDesk.assignTo")}
        </p>
        <select
          value={conversation.assigneeId ?? ""}
          onChange={(e) => {
            const id = e.target.value || null;
            const name = id
              ? (staffOptions.find((s) => s.id === id)?.name ?? null)
              : null;
            onAssigneeChange(id, name);
          }}
          className="w-full rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-2 py-1.5 text-xs text-[var(--admin-text)] outline-none focus:border-[var(--admin-muted)]"
        >
          <option value="">{t("admin.frontDesk.unassigned")}</option>
          {staffOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
