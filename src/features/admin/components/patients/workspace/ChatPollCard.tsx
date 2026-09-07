"use client";

import { Check } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import { chatTextDir } from "./chatTextDirection";

type Option = { id: string; label: string; value: string };

type Props = {
  question: string;
  options: Option[];
  selectedId?: string | null;
  disabled?: boolean;
  onSelect: (option: Option) => void;
};

export function ChatPollCard({
  question,
  options,
  selectedId,
  disabled,
  onSelect,
}: Props) {
  const t = useTranslations();
  const locked = Boolean(selectedId) || disabled;
  const questionDir = chatTextDir(question);

  return (
    <div className="mt-2.5 rounded-2xl border border-[#E8EAED] bg-[#F8F9FB] p-3">
      <p
        dir={questionDir}
        className={`text-[13px] font-semibold text-[#111111] ${
          questionDir === "rtl" ? "text-end" : "text-start"
        }`}
      >
        {question}
      </p>
      <div className="mt-2.5 space-y-2">
        {options.map((option) => {
          const selected = selectedId === option.id;
          const optionDir = chatTextDir(option.label);
          return (
            <button
              key={option.id}
              type="button"
              disabled={locked}
              onClick={() => onSelect(option)}
              dir={optionDir}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium text-[#111111] transition-colors ${
                optionDir === "rtl"
                  ? "flex-row-reverse text-end"
                  : "text-start"
              } ${
                selected
                  ? "border-[#111111] bg-[#F1F3F5]"
                  : "border-[#E8EAED] bg-white hover:border-[#C5C9D2]"
              } disabled:cursor-default`}
            >
              <span
                className={`flex size-5 shrink-0 items-center justify-center rounded-md border-2 ${
                  selected
                    ? "border-[#111111] bg-[#111111] text-white"
                    : "border-[#C5C9D2] bg-white"
                }`}
                aria-hidden
              >
                {selected ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">{option.label}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-start text-[11px] text-[#70758A]">
        {selectedId
          ? t("admin.poll.choiceSaved")
          : t("admin.poll.selectOne")}
      </p>
    </div>
  );
}
