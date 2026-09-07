"use client";

import type { TreatmentAiDraft } from "@/services/ai_groq";

type Props = { draft: TreatmentAiDraft };

export function AiDraftPreview({ draft }: Props) {
  const rows: [string, string][] = [
    ["CDT", draft.cdt_code || "—"],
    ["Fee", draft.fee_amount ? `EGP ${draft.fee_amount}` : "—"],
    ["Severity", draft.severity],
    ["Last treatment", strip(draft.last_treatment) || "—"],
    ["Title", draft.ai_title || "—"],
    ["Description", strip(draft.ai_description) || "—"],
    ["Confidence", draft.ai_confidence || "—"],
    ["Recommendation", strip(draft.ai_recommendation) || "—"],
  ];

  return (
    <dl className="space-y-1 rounded-xl bg-[#E8EAED]/60 px-3 py-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-2 text-[11px]">
          <dt className="w-24 shrink-0 font-medium text-[#70758A]">{label}</dt>
          <dd className="min-w-0 flex-1 truncate text-[#111111]" title={value}>
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function strip(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
