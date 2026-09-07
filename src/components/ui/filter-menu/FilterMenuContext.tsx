"use client";

import { createContext, useContext } from "react";
import type { FilterField } from "./types";

export type FilterMenuContextValue = {
  query: string;
  setQuery: (query: string) => void;
  visibleFields: FilterField[];
};

export const FilterMenuContext = createContext<FilterMenuContextValue | null>(
  null,
);

export function useFilterMenu() {
  const ctx = useContext(FilterMenuContext);
  if (!ctx) {
    throw new Error("FilterMenu components must be used inside FilterMenu");
  }
  return ctx;
}
