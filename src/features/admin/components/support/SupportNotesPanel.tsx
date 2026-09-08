"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { sortNotes } from "./noteHelpers";
import { SupportNoteCard } from "./SupportNoteCard";
import type { SupportNote } from "./supportDummyData";

type Props = {
  notes: SupportNote[];
  onAdd?: (body: string) => void | Promise<void>;
  onTogglePin?: (id: string, pinned: boolean) => void | Promise<void>;
  onEdit?: (id: string, body: string) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
};

export function SupportNotesPanel({
  notes,
  onAdd,
  onTogglePin,
  onEdit,
  onDelete,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const draftDir = locale === "ar" ? "rtl" : "ltr";
  const ordered = useMemo(() => sortNotes(notes), [notes]);

  async function saveDraft() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await onAdd?.(body);
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit(id: string) {
    const body = editBody.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await onEdit?.(id, body);
      setEditingId(null);
      setEditBody("");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(deleteId);
      setDeleteId(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 shadow-sm">
        <textarea
          placeholder={t("admin.frontDesk.addNote")}
          rows={3}
          value={draft}
          dir={draftDir}
          lang={draftDir === "rtl" ? "ar" : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void saveDraft();
            }
          }}
          className={cn(
            "w-full resize-none rounded-lg border border-[#FDE68A]/80 bg-white px-3 py-2.5 text-sm text-[#111827] outline-none placeholder:text-[#A16207] focus:border-[#F59E0B] focus:ring-2 focus:ring-[#FDE68A]/60",
            draftDir === "rtl"
              ? "text-right placeholder:text-right"
              : "text-left placeholder:text-left",
          )}
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[10px] text-[#A16207]/80">
            {t("admin.frontDesk.noteHint")}
          </p>
          <button
            type="button"
            disabled={busy || !draft.trim()}
            onClick={() => void saveDraft()}
            className="rounded-md bg-[#111827] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {t("admin.frontDesk.saveNote")}
          </button>
        </div>
      </div>

      {ordered.length === 0 ? (
        <p className="py-4 text-center text-xs text-[#9CA3AF]">
          {t("admin.frontDesk.noNotes")}
        </p>
      ) : null}

      <ul className="space-y-2">
        {ordered.map((n) => (
          <SupportNoteCard
            key={n.id}
            note={n}
            editing={editingId === n.id}
            editBody={editBody}
            busy={busy}
            onEditBody={setEditBody}
            onStartEdit={() => {
              setEditingId(n.id);
              setEditBody(n.body);
            }}
            onCancelEdit={() => {
              setEditingId(null);
              setEditBody("");
            }}
            onSaveEdit={() => void saveEdit(n.id)}
            onTogglePin={onTogglePin}
            onRequestDelete={onDelete ? (id) => setDeleteId(id) : undefined}
            canEdit={Boolean(onEdit)}
          />
        ))}
      </ul>

      <ConfirmDeleteDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteId(null);
        }}
        title={t("admin.frontDesk.deleteNoteTitle")}
        description={t("admin.frontDesk.deleteNoteConfirm")}
        pending={deleting}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
