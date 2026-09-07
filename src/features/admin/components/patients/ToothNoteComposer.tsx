"use client";

import { Paperclip, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ATTACHMENT_FILE_ACCEPT } from "@/lib/supabase/uploadHelpers";
import { RichTextEditor } from "./RichTextEditor";
import { isRichTextEmpty } from "./richTextUtils";

type Props = {
  draftBody: string;
  pendingFiles: File[];
  pending: boolean;
  expanded: boolean;
  onToggle: () => void;
  onDraftChange: (value: string) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemovePendingFile: (index: number) => void;
  onSave: () => void | Promise<void>;
};

export function ToothNoteComposer({
  draftBody,
  pendingFiles,
  pending,
  expanded,
  onToggle,
  onDraftChange,
  onAddFiles,
  onRemovePendingFile,
  onSave,
}: Props) {
  const canSave = !isRichTextEmpty(draftBody) && !pending;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full shrink-0 items-center gap-2 px-6 py-4 text-sm font-medium text-[#475569] hover:bg-[#f8fafc]"
      >
        <Plus className="size-4" aria-hidden />
        New clinical note
      </button>
    );
  }

  return (
    <div className="shrink-0 px-6 py-5">
      <RichTextEditor
        value={draftBody}
        onChange={onDraftChange}
        disabled={pending}
        placeholder="Write a clinical note…"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-[#64748b] hover:text-[#475569]">
          <Paperclip className="size-3.5" aria-hidden />
          Attach file
          <input
            type="file"
            multiple
            accept={ATTACHMENT_FILE_ACCEPT}
            className="sr-only"
            disabled={pending}
            onChange={(event) => {
              if (event.target.files?.length) onAddFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {pendingFiles.map((file, index) => (
          <span
            key={`${file.name}-${index}`}
            className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs text-[#64748b]"
          >
            {file.name}
            <button type="button" onClick={() => onRemovePendingFile(index)}>
              <X className="size-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Button type="button" size="sm" disabled={!canSave} onClick={onSave}>
          {pending ? "Saving…" : "Save note"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onToggle}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
