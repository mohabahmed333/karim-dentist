"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/i18n";
import {
  translateFrontDeskLabel,
  translateFrontDeskValue,
} from "./frontDeskI18n";

type Props = {
  title: string;
  badge?: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function SupportAccordion({
  title,
  badge,
  open,
  onToggle,
  children,
}: Props) {
  return (
    <div className="border-b border-[#E5E7EB]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[#111827]">
          {title}
          {badge != null ? (
            <span className="rounded-full bg-[#DBEAFE] px-1.5 py-0.5 text-[10px] font-semibold text-[#1D4ED8]">
              ({badge})
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[#9CA3AF] transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

export function SupportKeyValueList({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  const t = useTranslations();
  return (
    <dl className="space-y-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="grid grid-cols-[1fr_1fr] gap-2 text-xs"
        >
          <dt className="text-[#9CA3AF]">
            {translateFrontDeskLabel(item.label, t)}
          </dt>
          <dd className="text-right font-medium text-[#111827]">
            {translateFrontDeskValue(item.value, t)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
