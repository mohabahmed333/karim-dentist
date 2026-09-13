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
    <div className="border-b border-[var(--admin-border)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--admin-text)]">
          {title}
          {badge != null ? (
            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              ({badge})
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-[var(--admin-muted)] transition-transform",
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
          <dt className="text-[var(--admin-muted)]">
            {translateFrontDeskLabel(item.label, t)}
          </dt>
          <dd className="text-right font-medium text-[var(--admin-text)]">
            {translateFrontDeskValue(item.value, t)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
