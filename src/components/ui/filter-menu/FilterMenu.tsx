"use client";

import { useState, type ReactNode } from "react";
import { DropdownMenu } from "@/components/ui/dropdown-menu";
import { matchFilterItems } from "./matchFilterItems";
import { FilterMenuContext } from "./FilterMenuContext";
import type { FilterField } from "./types";

type Props = {
  fields: FilterField[];
  children: ReactNode;
};

export function FilterMenu({ fields, children }: Props) {
  const [query, setQuery] = useState("");

  const matched = matchFilterItems(
    fields.map((field) => ({
      id: field.id,
      label: field.label,
      keywords:
        field.kind === "choice" || field.kind === "multi"
          ? field.options.map((option) => option.label)
          : [field.hint ?? ""],
    })),
    query,
  );
  const matchedIds = new Set(matched.map((item) => item.id));
  const visibleFields = fields.filter((field) => matchedIds.has(field.id));

  return (
    <FilterMenuContext.Provider value={{ query, setQuery, visibleFields }}>
      <DropdownMenu
        onOpenChange={(open) => {
          if (!open) setQuery("");
        }}
      >
        {children}
      </DropdownMenu>
    </FilterMenuContext.Provider>
  );
}
