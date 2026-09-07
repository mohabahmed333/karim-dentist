"use client";

import { Button } from "@/components/ui/button";
import { useTranslations, type AnyMessageKey } from "@/lib/i18n";
import {
  MEDIA_LIBRARY_SECTIONS,
  type MediaLibrarySection,
} from "../lib/mediaLibrarySections";

const SECTION_LABEL: Record<MediaLibrarySection, AnyMessageKey> = {
  all: "admin.customize.mediaSectionAll",
  hero: "admin.customize.mediaSectionHero",
  about: "admin.customize.mediaSectionAbout",
  projects: "admin.customize.mediaSectionProjects",
  clients: "admin.customize.mediaSectionClients",
};

type Props = {
  value: MediaLibrarySection;
  onChange: (section: MediaLibrarySection) => void;
};

export function MediaLibrarySectionTabs({ value, onChange }: Props) {
  const t = useTranslations();
  return (
    <div
      className="flex flex-wrap gap-1.5"
      role="tablist"
      aria-label={t("admin.customize.mediaSectionFilter")}
    >
      {MEDIA_LIBRARY_SECTIONS.map((section) => (
        <Button
          key={section}
          type="button"
          size="sm"
          role="tab"
          aria-selected={value === section}
          variant={value === section ? "default" : "outline"}
          className="h-7 px-2.5 text-xs"
          onClick={() => onChange(section)}
        >
          {t(SECTION_LABEL[section])}
        </Button>
      ))}
    </div>
  );
}
