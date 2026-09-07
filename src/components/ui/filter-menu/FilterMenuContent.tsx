"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenuContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { filterMenuPanelClass } from "./filterMenuStyles";
import { useFilterMenu } from "./FilterMenuContext";
import type { ReactNode } from "react";

type Props = {
  searchPlaceholder: string;
  emptyLabel: string;
  children: ReactNode;
};

export function FilterMenuContent({
  searchPlaceholder,
  emptyLabel,
  children,
}: Props) {
  const { query, setQuery, visibleFields } = useFilterMenu();
  const empty = query.trim().length > 0 && visibleFields.length === 0;

  return (
    <DropdownMenuContent
      align="start"
      sideOffset={8}
      className={`w-60 min-w-60 ${filterMenuPanelClass}`}
    >
      <div className="px-1.5 py-1">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted,#6b6f76)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder={searchPlaceholder}
            className="h-9 rounded-lg border border-[var(--admin-border,#e6e6e6)] bg-[var(--admin-canvas,#f7f8f8)] ps-9 shadow-none"
          />
        </label>
      </div>
      <DropdownMenuSeparator className="mx-1.5 bg-[var(--admin-border)]" />
      {empty ? (
        <p className="px-2.5 py-3 text-xs text-[var(--admin-muted)]">
          {emptyLabel}
        </p>
      ) : (
        children
      )}
    </DropdownMenuContent>
  );
}
