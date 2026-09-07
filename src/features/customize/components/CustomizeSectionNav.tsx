"use client";

import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { useCustomizeData } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import { collectionItems } from "../lib/collectionMeta";
import { SECTION_LABEL_KEYS } from "../sectionRegistry";
import { useTranslations } from "@/lib/i18n";
import {
  CUSTOMIZE_SECTIONS,
  isCollectionSection,
  type CustomizeSection,
} from "../types";
import { CustomizeToolbarMenu } from "./CustomizeToolbarMenu";

type Props = { active: CustomizeSection; itemId: string | null };

export function CustomizeSectionNav({ active, itemId }: Props) {
  const data = useCustomizeData();
  const { navigateSection } = useCustomizeRoute();
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const count = isCollectionSection(active)
    ? collectionItems(data, active).length
    : null;

  return (
    <nav aria-label={t("admin.nav.content")} data-tour="section-nav" className="min-w-0">
      <CustomizeToolbarMenu
        open={open}
        onOpenChange={setOpen}
        labelledBy="customize-section-menu-title"
        panelClassName="w-[min(240px,calc(100vw-1.5rem))]"
        trigger={
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((value) => !value)}
            className="flex max-w-[11rem] items-center gap-1.5 rounded-[6px] bg-[#ebebeb] px-2.5 py-1 text-[12px] font-medium text-[#1a1a1a] hover:bg-[#e2e2e2]"
          >
            <span className="truncate">{t(SECTION_LABEL_KEYS[active])}</span>
            {count !== null ? (
              <span className="text-[10px] tabular-nums text-[#8a8a8a]">
                {count}
              </span>
            ) : null}
            {itemId ? (
              <span className="text-[10px] text-[#8a8a8a]">· item</span>
            ) : null}
            <ChevronDownIcon className="size-3.5 shrink-0 opacity-60" />
          </button>
        }
      >
        <p
          id="customize-section-menu-title"
          className="border-b border-[#f0f0f0] px-3 py-2 text-[12px] font-semibold text-[#1a1a1a]"
        >
          {t("admin.nav.content")}
        </p>
        <ul className="max-h-72 overflow-y-auto p-1">
          {CUSTOMIZE_SECTIONS.map((section) => {
            const sectionCount = isCollectionSection(section)
              ? collectionItems(data, section).length
              : null;
            const selected = active === section;
            return (
              <li key={section}>
                <button
                  type="button"
                  onClick={() => {
                    navigateSection(section);
                    setOpen(false);
                  }}
                  className={
                    selected
                      ? "flex w-full items-center gap-2 rounded-[6px] bg-[#f0f0f0] px-2.5 py-2 text-start text-[12px] font-medium text-[#1a1a1a]"
                      : "flex w-full items-center gap-2 rounded-[6px] px-2.5 py-2 text-start text-[12px] text-[#1a1a1a] hover:bg-[#f5f5f5]"
                  }
                >
                  <span className="min-w-0 flex-1 truncate">
                    {t(SECTION_LABEL_KEYS[section])}
                  </span>
                  {sectionCount !== null ? (
                    <span className="text-[10px] tabular-nums text-[#8a8a8a]">
                      {sectionCount}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </CustomizeToolbarMenu>
    </nav>
  );
}
