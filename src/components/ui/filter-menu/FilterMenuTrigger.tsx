"use client";

import { ChevronDown, ListFilter, X } from "lucide-react";
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type FilterMenuPill = {
  id: string;
  label: string;
  onClear: () => void;
};

type Props = {
  label: string;
  pills?: FilterMenuPill[];
  onClearAll?: () => void;
  clearAllLabel?: string;
};

export function FilterMenuTrigger({
  label,
  pills = [],
  onClearAll,
  clearAllLabel,
}: Props) {
  const hasPills = pills.length > 0;

  return (
    <DropdownMenuTrigger
      nativeButton={false}
      render={<div />}
      className="admin-card inline-flex min-h-9 w-auto max-w-full cursor-pointer flex-wrap items-center gap-1.5 rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] px-2.5 py-1.5 text-sm text-[var(--admin-text)] outline-none hover:bg-[var(--admin-hover)] sm:min-w-[14rem] sm:max-w-xl"
    >
      <ListFilter className="size-3.5 shrink-0 text-[var(--admin-muted)]" />
      {!hasPills ? <span className="font-medium">{label}</span> : null}
      {pills.map((pill) => (
        <span
          key={pill.id}
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pill.onClear();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              pill.onClear();
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--admin-border)] bg-[var(--admin-active,#eceef9)] px-2 py-0.5 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
          title={pill.label}
        >
          <span className="max-w-[12rem] truncate">{pill.label}</span>
          <X className="size-3 shrink-0 text-[var(--admin-muted)]" />
        </span>
      ))}
      {onClearAll && clearAllLabel && pills.length > 1 ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onClearAll();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="px-1 text-xs font-medium text-[var(--admin-primary)] hover:underline"
        >
          {clearAllLabel}
        </button>
      ) : null}
      <ChevronDown className="ms-auto size-3.5 shrink-0 text-[var(--admin-muted)]" />
    </DropdownMenuTrigger>
  );
}
