"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "@/lib/i18n";
import {
  CUSTOMIZE_SECTIONS,
  type CustomizeSection,
} from "../types";
import { SECTION_LABEL_KEYS } from "../sectionRegistry";
import { CMS_TRANSLATE_SCOPE_OPTIONS } from "../lib/collectCmsTranslateJobs";

const MODULE_OPTIONS = CMS_TRANSLATE_SCOPE_OPTIONS.filter(
  (option) => option.value !== "all",
);

type Props = {
  selected: CustomizeSection[];
  disabled?: boolean;
  onToggleModule: (section: CustomizeSection) => void;
  onToggleAll: () => void;
};

export function TranslateModuleChecklist({
  selected,
  disabled,
  onToggleModule,
  onToggleAll,
}: Props) {
  const t = useTranslations();
  const allSelected = selected.length === CUSTOMIZE_SECTIONS.length;

  return (
    <ul className="max-h-64 overflow-y-auto py-1">
      <li>
        <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-[#f5f5f5]">
          <Checkbox
            checked={allSelected}
            onCheckedChange={() => onToggleAll()}
            disabled={disabled}
          />
          <span className="text-[12px] font-medium text-[#1a1a1a]">
            {t("admin.customize.allModules")}
          </span>
        </label>
      </li>
      {MODULE_OPTIONS.map((option) => {
        const value = option.value as CustomizeSection;
        const checked = selected.includes(value);
        const labelKey = SECTION_LABEL_KEYS[value];
        return (
          <li key={value}>
            <label
              className={[
                "flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-[#f5f5f5]",
                checked ? "bg-[#f7f7f7]" : "",
              ].join(" ")}
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggleModule(value)}
                disabled={disabled}
              />
              <span className="text-[12px] text-[#1a1a1a]">
                {labelKey ? t(labelKey) : option.label}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

export function translateModulesSummary(selected: CustomizeSection[]): string {
  if (selected.length === CUSTOMIZE_SECTIONS.length) return "All modules";
  if (selected.length === 0) return "None";
  if (selected.length === 1) {
    return (
      MODULE_OPTIONS.find((option) => option.value === selected[0])?.label ??
      "1"
    );
  }
  return `${selected.length} modules`;
}
