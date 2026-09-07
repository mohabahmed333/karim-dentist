"use client";

import { Check, Copy, Pencil, Pin, PinOff, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "@/lib/i18n";
import { formatNoteTime, noteBodyDir } from "./noteHelpers";
import type { SupportNote } from "./supportDummyData";

type Props = {
  note: SupportNote;
  editing: boolean;
  editBody: string;
  busy: boolean;
  onEditBody: (body: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onTogglePin?: (id: string, pinned: boolean) => void;
  onRequestDelete?: (id: string) => void;
  canEdit?: boolean;
};

export function SupportNoteCard({
  note: n,
  editing,
  editBody,
  busy,
  onEditBody,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTogglePin,
  onRequestDelete,
  canEdit,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const bodyDir = noteBodyDir(n.body);
  const edited =
    Boolean(n.updatedAt && n.createdAt && n.updatedAt !== n.createdAt);

  return (
    <li
      className={cn(
        "rounded-xl border bg-white p-3 shadow-sm",
        n.pinned ? "border-[#F59E0B]/50 bg-[#FFFBEB]" : "border-[#E5E7EB]",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-semibold text-[#111827]">
            {n.author}
            {n.pinned ? (
              <span className="ms-1.5 inline-flex items-center gap-0.5 rounded-full bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-medium text-[#B45309]">
                <Pin className="h-2.5 w-2.5" />
                {t("admin.frontDesk.pinned")}
              </span>
            ) : null}
          </p>
          <p className="text-[10px] text-[#9CA3AF]">
            {formatNoteTime(n.updatedAt || n.createdAt, locale)}
            {edited ? ` · ${t("admin.frontDesk.edited")}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <IconBtn
            label={
              n.pinned ? t("admin.frontDesk.unpin") : t("admin.frontDesk.pin")
            }
            onClick={() => onTogglePin?.(n.id, !n.pinned)}
          >
            {n.pinned ? (
              <PinOff className="h-3.5 w-3.5" />
            ) : (
              <Pin className="h-3.5 w-3.5" />
            )}
          </IconBtn>
          <IconBtn
            label={t("admin.frontDesk.copyNote")}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(n.body);
                toast.success(t("admin.frontDesk.noteCopied"));
              } catch {
                toast.error(t("admin.frontDesk.noteCopyFail"));
              }
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </IconBtn>
          {canEdit ? (
            <IconBtn label={t("admin.edit")} onClick={onStartEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </IconBtn>
          ) : null}
          {onRequestDelete ? (
            <IconBtn
              label={t("admin.delete")}
              danger
              onClick={() => onRequestDelete(n.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </IconBtn>
          ) : null}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            rows={3}
            value={editBody}
            dir={noteBodyDir(editBody)}
            onChange={(e) => onEditBody(e.target.value)}
            className="w-full resize-none rounded-lg border border-[#E5E7EB] px-3 py-2 text-sm outline-none focus:border-[#F59E0B]"
          />
          <div className="flex justify-end gap-1.5">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#6B7280] hover:bg-[#F3F4F6]"
              onClick={onCancelEdit}
            >
              <X className="h-3 w-3" />
              {t("admin.cancel")}
            </button>
            <button
              type="button"
              disabled={busy || !editBody.trim()}
              className="inline-flex items-center gap-1 rounded-md bg-[#111827] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-40"
              onClick={onSaveEdit}
            >
              <Check className="h-3 w-3" />
              {t("admin.save")}
            </button>
          </div>
        </div>
      ) : (
        <p
          dir={bodyDir}
          lang={bodyDir === "rtl" ? "ar" : undefined}
          className={cn(
            "whitespace-pre-wrap text-sm leading-relaxed text-[#111827]",
            bodyDir === "rtl" ? "text-right" : "text-left",
          )}
        >
          {n.body}
        </p>
      )}
    </li>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#111827]",
        danger && "hover:bg-red-50 hover:text-red-600",
      )}
    >
      {children}
    </button>
  );
}
