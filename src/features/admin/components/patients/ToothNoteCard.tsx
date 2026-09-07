"use client";

import Image from "next/image";
import { Paperclip, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ATTACHMENT_FILE_ACCEPT } from "@/lib/supabase/uploadHelpers";
import type { PatientToothNote } from "@/services/patient_tooth_notes";
import { formatClinicalNoteHeading } from "./clinicalNoteFormat";
import { RichTextEditor } from "./RichTextEditor";
import { isRichTextEmpty, RichTextHtml } from "./richTextUtils";

type Props = {
  note: PatientToothNote;
  pending: boolean;
  editing: boolean;
  editBody: string;
  editPendingFiles: File[];
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onEditBodyChange: (value: string) => void;
  onAddEditFiles: (files: FileList | File[]) => void;
  onRemoveEditPendingFile: (index: number) => void;
  onRemoveAttachment: (attachmentId: string) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
};

export function ToothNoteCard({
  note,
  pending,
  editing,
  editBody,
  editPendingFiles,
  onStartEdit,
  onCancelEdit,
  onEditBodyChange,
  onAddEditFiles,
  onRemoveEditPendingFile,
  onRemoveAttachment,
  onSaveEdit,
  onDelete,
}: Props) {
  const canSaveEdit = !isRichTextEmpty(editBody) && !pending;

  return (
    <li className="group py-7 first:pt-6 last:pb-8">
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <h4 className="text-[15px] font-semibold leading-snug text-[#1e293b]">
          {formatClinicalNoteHeading(note.created_at)}
        </h4>
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {!editing ? (
            <button
              type="button"
              onClick={onStartEdit}
              className="rounded p-1 text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#475569]"
              aria-label="Edit note"
            >
              <Pencil className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="rounded p-1 text-[#94a3b8] hover:bg-[#f8fafc] hover:text-[#ef4444] disabled:opacity-50"
            aria-label="Remove note"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <RichTextEditor
            value={editBody}
            onChange={onEditBodyChange}
            disabled={pending}
            placeholder="Edit clinical note…"
          />
          {note.patient_tooth_note_attachments.length > 0 ? (
            <ul className="space-y-1">
              {note.patient_tooth_note_attachments.map((file) => (
                <li
                  key={file.id}
                  className="flex items-center justify-between gap-2 text-xs text-[#64748b]"
                >
                  <span className="truncate">{file.file_name}</span>
                  <button type="button" onClick={() => onRemoveAttachment(file.id)}>
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#64748b] hover:text-[#475569]">
            <Paperclip className="size-3.5" aria-hidden />
            Add attachment
            <input
              type="file"
              multiple
              accept={ATTACHMENT_FILE_ACCEPT}
              className="sr-only"
              disabled={pending}
              onChange={(event) => {
                if (event.target.files?.length) onAddEditFiles(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {editPendingFiles.map((file, index) => (
            <p key={`${file.name}-${index}`} className="text-xs text-[#64748b]">
              {file.name}
              <button
                type="button"
                className="ms-2"
                onClick={() => onRemoveEditPendingFile(index)}
              >
                <X className="inline size-3" />
              </button>
            </p>
          ))}
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={!canSaveEdit} onClick={onSaveEdit}>
              {pending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onCancelEdit}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <RichTextHtml
            html={note.body}
            className="text-[14px] leading-[1.7] text-[#4b5563]"
          />
          {note.patient_tooth_note_attachments.length > 0 ? (
            <div className="mt-4 space-y-2">
              {note.patient_tooth_note_attachments.map((file) =>
                file.kind === "image" ? (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-md"
                  >
                    <Image
                      src={file.file_url}
                      alt={file.file_name}
                      width={480}
                      height={280}
                      className="h-auto max-h-44 w-full object-cover"
                    />
                  </a>
                ) : (
                  <a
                    key={file.id}
                    href={file.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-[#64748b] hover:text-[#475569] hover:underline"
                  >
                    <Paperclip className="size-3" aria-hidden />
                    {file.file_name}
                  </a>
                ),
              )}
            </div>
          ) : null}
        </>
      )}
    </li>
  );
}
