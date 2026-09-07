"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, StickyNote } from "lucide-react";
import type { ClinicalNote } from "@/services/clinical_notes";
import { RichTextEditor } from "../RichTextEditor";
import { isRichTextEmpty, RichTextHtml } from "../richTextUtils";

type Props = {
  notes: ClinicalNote[];
  onSave: (content: string) => void;
};

export function TreatmentInlineNotes({ notes, onSave }: Props) {
  const [open, setOpen] = useState(notes.length > 0);
  const [draft, setDraft] = useState("");

  function save() {
    if (isRichTextEmpty(draft)) return;
    onSave(draft);
    setDraft("");
    setOpen(true);
  }

  return (
    <div className="rounded-xl border border-[#E0E7FF] bg-[#F8FAFC]">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-start"
      >
        <StickyNote className="size-3.5 text-[#3730A3]" />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-[#3730A3]">
          Notes · {notes.length}
        </span>
        {open ? (
          <ChevronUp className="size-3.5 text-[#64748B]" />
        ) : (
          <ChevronDown className="size-3.5 text-[#64748B]" />
        )}
      </button>
      {open ? (
        <div className="space-y-2 border-t border-[#E0E7FF] px-3 py-2.5">
          {notes.length === 0 ? (
            <p className="text-[11px] text-[#94A3B8]">No notes yet.</p>
          ) : (
            <ul className="max-h-28 space-y-1.5 overflow-y-auto">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-lg bg-white px-2.5 py-1.5 text-[12px] text-[#334155]"
                >
                  <span className="mb-1 block text-[10px] font-semibold uppercase text-[#64748B]">
                    {note.category}
                  </span>
                  <RichTextHtml html={note.content} />
                </li>
              ))}
            </ul>
          )}
          <RichTextEditor
            key={`note-draft-${notes.length}`}
            value={draft}
            onChange={setDraft}
            placeholder="Add a note…"
            minHeightClass="min-h-20"
          />
          <button
            type="button"
            disabled={isRichTextEmpty(draft)}
            onClick={save}
            className="w-full rounded-lg bg-[#3730A3] py-1.5 text-[12px] font-semibold text-white hover:bg-[#312E81] disabled:opacity-40"
          >
            Save note
          </button>
        </div>
      ) : null}
    </div>
  );
}
