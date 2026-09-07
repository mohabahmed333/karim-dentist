"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import {
  CUSTOMIZE_SECTIONS,
  type CustomizeSection,
} from "../types";
import type { CmsTranslateSelection } from "../lib/collectCmsTranslateJobs";
import { useCmsTranslate } from "./CmsTranslateProvider";
import { CustomizeToolbarMenu } from "./CustomizeToolbarMenu";
import {
  TranslateModuleChecklist,
  translateModulesSummary,
} from "./TranslateModuleChecklist";

type Props = {
  activeSection: CustomizeSection;
};

export function CustomizeTranslateControls({ activeSection }: Props) {
  const t = useTranslations();
  const { isTranslating, translate } = useCmsTranslate();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CustomizeSection[]>([
    activeSection,
  ]);

  useEffect(() => {
    setSelected((current) =>
      current.length === CUSTOMIZE_SECTIONS.length
        ? [...CUSTOMIZE_SECTIONS]
        : [activeSection],
    );
  }, [activeSection]);

  const allSelected = selected.length === CUSTOMIZE_SECTIONS.length;

  function toggleModule(section: CustomizeSection) {
    setSelected((current) =>
      current.includes(section)
        ? current.filter((value) => value !== section)
        : [...current, section],
    );
  }

  function toggleAll() {
    setSelected(allSelected ? [] : [...CUSTOMIZE_SECTIONS]);
  }

  function selection(): CmsTranslateSelection {
    return allSelected ? "all" : selected;
  }

  return (
    <CustomizeToolbarMenu
      open={open}
      onOpenChange={setOpen}
      labelledBy="cms-translate-menu-title"
      align="end"
      panelClassName="w-[min(280px,calc(100vw-1.5rem))]"
      trigger={
        <button
          type="button"
          disabled={isTranslating}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((value) => !value)}
          className="rounded-[6px] px-2 py-1 text-[11px] text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#1a1a1a] disabled:opacity-50"
        >
          {t("admin.customize.translate")} · {translateModulesSummary(selected)}
        </button>
      }
    >
      <div className="border-b border-[#f0f0f0] px-3 py-2">
        <p
          id="cms-translate-menu-title"
          className="text-[13px] font-semibold text-[#1a1a1a]"
        >
          {t("admin.customize.translate")}
        </p>
      </div>
      <TranslateModuleChecklist
        selected={selected}
        disabled={isTranslating}
        onToggleModule={toggleModule}
        onToggleAll={toggleAll}
      />
      <div className="flex items-center justify-between gap-2 border-t border-[#f0f0f0] px-3 py-2">
        <button
          type="button"
          className="text-[11px] font-medium text-[#2f6fed] hover:underline disabled:opacity-50"
          disabled={isTranslating}
          onClick={toggleAll}
        >
          {allSelected ? t("admin.cancel") : t("admin.customize.allModules")}
        </button>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-[6px] px-2 text-[11px]"
            disabled={isTranslating}
            onClick={() => {
              void translate("to-ar", selection());
              setOpen(false);
            }}
          >
            {t("admin.customize.translateToAr")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-[6px] px-2 text-[11px]"
            disabled={isTranslating}
            onClick={() => {
              void translate("to-en", selection());
              setOpen(false);
            }}
          >
            {t("admin.customize.translateToEn")}
          </Button>
        </div>
      </div>
    </CustomizeToolbarMenu>
  );
}
