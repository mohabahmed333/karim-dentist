"use client";

import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterMenuMultiPanel } from "./FilterMenuMultiPanel";
import { filterMenuRowClass } from "./filterMenuStyles";
import { useFilterMenu } from "./FilterMenuContext";

export function FilterMenuFields() {
  const { visibleFields } = useFilterMenu();
  if (visibleFields.length === 0) return null;

  return (
    <>
      {visibleFields.map((field) => {
        const Icon = field.icon;
        return (
          <DropdownMenuSub key={field.id}>
            <DropdownMenuSubTrigger className={filterMenuRowClass}>
              <Icon />
              <span className="flex-1 truncate">{field.label}</span>
              {field.hint ? (
                <span className="max-w-[6rem] truncate text-[11px] text-[var(--admin-muted)]">
                  {field.hint}
                </span>
              ) : null}
            </DropdownMenuSubTrigger>
            {field.kind === "date" ? (
              field.panel
            ) : field.kind === "multi" ? (
              <FilterMenuMultiPanel field={field} />
            ) : (
              <DropdownMenuSubContent
                className="min-w-44 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel,#ffffff)] p-1.5"
                align="start"
                side="inline-end"
              >
                <DropdownMenuRadioGroup
                  value={field.value}
                  onValueChange={field.onSelect}
                >
                  {field.options.map((option) => (
                    <DropdownMenuRadioItem
                      key={option.id}
                      value={option.id}
                      className={filterMenuRowClass}
                    >
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            )}
          </DropdownMenuSub>
        );
      })}
    </>
  );
}
