"use client";

import { useState } from "react";
import { AI_ASSIST_CHIPS, CDT_QUICK_ACTIONS } from "./clinicalCatalog";

const EXAMPLE_BLOCKS = [
  {
    id: "ex-1",
    title: "Deep caries — #21",
    body: "Patient reports lingering cold. Radiograph suggests deep approximal caries. Plan: liner + composite; reassess vitality in 2 weeks.",
  },
  {
    id: "ex-2",
    title: "Crown prep sequence",
    body: "Reduce occlusal 1.5–2mm, chamfer margin, provisionalize, send to lab for PFM/zirconia. Check occlusion at seat.",
  },
];

type Props = {
  onPickCdt: (cdtCode: string, label: string) => void;
};

export function AiAssistPanel({ onPickCdt }: Props) {
  const [detail, setDetail] = useState(EXAMPLE_BLOCKS[0]?.body ?? "");
  const [chat, setChat] = useState("");

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          Quick choices
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AI_ASSIST_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setDetail(chip.narrative)}
              className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-medium text-[#374151] hover:border-[#2563eb] hover:text-[#2563eb]"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          Clinic menu
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CDT_QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onPickCdt(action.cdtCode, action.procedureName)}
              className="rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-2 text-left hover:border-[#2563eb]"
            >
              <span className="block text-[12px] font-semibold text-[#111827]">
                {action.cdtCode}
              </span>
              <span className="block text-[10px] text-[#6b7280]">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9ca3af]">
          Full-detail examples
        </p>
        <div className="mt-2 space-y-2">
          {EXAMPLE_BLOCKS.map((block) => (
            <button
              key={block.id}
              type="button"
              onClick={() => setDetail(block.body)}
              className="w-full rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-left"
            >
              <span className="block text-[12px] font-medium text-[#111827]">
                {block.title}
              </span>
            </button>
          ))}
        </div>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={4}
          className="mt-2 w-full resize-y rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        />
      </div>

      <form
        className="border-t border-[#e5e7eb] pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!chat.trim()) return;
          setDetail((prev) =>
            prev ? `${prev}\n\n${chat.trim()}` : chat.trim(),
          );
          setChat("");
        }}
      >
        <label htmlFor="ai-chat" className="sr-only">
          Describe the case
        </label>
        <input
          id="ai-chat"
          value={chat}
          onChange={(e) => setChat(e.target.value)}
          placeholder="Describe the case or tap a choice…"
          className="w-full rounded-full border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb]"
        />
      </form>
    </div>
  );
}
