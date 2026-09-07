import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export type FilterOption = {
  id: string;
  label: string;
};

type FilterFieldBase = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
};

export type ChoiceFilterField = FilterFieldBase & {
  kind: "choice";
  value: string;
  options: FilterOption[];
  onSelect: (id: string) => void;
};

export type MultiFilterField = FilterFieldBase & {
  kind: "multi";
  values: string[];
  options: FilterOption[];
  searchPlaceholder: string;
  emptyLabel: string;
  onToggle: (id: string) => void;
};

export type DateFilterField = FilterFieldBase & {
  kind: "date";
  panel: ReactNode;
};

export type FilterField = ChoiceFilterField | MultiFilterField | DateFilterField;
