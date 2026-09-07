"use client";

import type { ClinicalNoteCategory } from "@/services/clinical_notes";

type Props = {
  title: string;
  category: ClinicalNoteCategory;
  content: string;
  categories: readonly ClinicalNoteCategory[];
  stamps: readonly string[];
  canSave: boolean;
  onCategory: (value: ClinicalNoteCategory) => void;
  onContent: (value: string) => void;
  onStamp: (stamp: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export function ClinicalNoteModalBody({
  title,
  category,
  content,
  categories,
  stamps,
  canSave,
  onCategory,
  onContent,
  onStamp,
  onClose,
  onSave,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close note"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategory(item)}
            className={`rounded-full px-3 py-1 text-[11px] font-medium ${
              category === item
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {item === "Alert" ? "Patient Alert ⚠️" : item}
          </button>
        ))}
      </div>
      <textarea
        value={content}
        onChange={(event) => onContent(event.target.value)}
        rows={5}
        placeholder="Type clinical observations, symptoms, or treatment notes..."
        className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
      />
      <div className="flex flex-wrap gap-2">
        {stamps.map((stamp) => (
          <button
            key={stamp}
            type="button"
            onClick={() => onStamp(stamp)}
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600"
          >
            {stamp}
          </button>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canSave}
          onClick={onSave}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
        >
          Save Note
        </button>
      </div>
    </div>
  );
}
