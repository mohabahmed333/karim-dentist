"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  DropdownMenuItem,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { filterMenuPanelClass, filterMenuRowClass } from "./filterMenuStyles";
import type { MultiFilterField } from "./types";

type Props = { field: MultiFilterField };

export function FilterMenuMultiPanel({ field }: Props) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return field.options;
    return field.options.filter((option) =>
      option.label.toLowerCase().includes(needle),
    );
  }, [field.options, query]);

  return (
    <DropdownMenuSubContent
      align="start"
      side="inline-end"
      sideOffset={6}
      className={`w-64 overflow-hidden ${filterMenuPanelClass}`}
    >
      <div className="bg-[var(--admin-panel,#ffffff)] px-1 pb-1">
        <label className="relative block">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--admin-muted)]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder={field.searchPlaceholder}
            className="h-8 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas,#f7f8f8)] ps-8 shadow-none"
          />
        </label>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-2.5 py-3 text-xs text-[var(--admin-muted)]">
            {field.emptyLabel}
          </p>
        ) : (
          filtered.map((option) => {
            const checked = field.values.includes(option.id);
            return (
              <DropdownMenuItem
                key={option.id}
                closeOnClick={false}
                className={filterMenuRowClass}
                onClick={() => field.onToggle(option.id)}
              >
                <Checkbox
                  checked={checked}
                  tabIndex={-1}
                  className="pointer-events-none rounded-[4px] data-checked:border-[var(--admin-primary)] data-checked:bg-[var(--admin-primary)]"
                />
                <span className="flex-1 truncate">{option.label}</span>
              </DropdownMenuItem>
            );
          })
        )}
      </div>
    </DropdownMenuSubContent>
  );
}
