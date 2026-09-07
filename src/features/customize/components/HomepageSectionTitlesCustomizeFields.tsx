"use client";

import type { SiteSettings } from "@/services/site_settings";
import { BilingualField } from "@/features/customize/components/BilingualField";
import {
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_LABELS,
} from "@/features/portfolio/lib/homepageSectionOrder";
import { HOMEPAGE_SECTION_TITLE_FIELDS } from "@/features/portfolio/lib/homepageSectionNav";
import {
  EditorFieldCard,
  EditorSectionHeader,
} from "@/features/customize/components/EditorSectionChrome";

type Props = {
  settings: SiteSettings;
  patchSettings: (patch: Partial<SiteSettings>) => void;
};

function arFieldKey(key: keyof SiteSettings): keyof SiteSettings {
  return `${String(key)}_ar` as keyof SiteSettings;
}

export function HomepageSectionTitlesCustomizeFields({
  settings,
  patchSettings,
}: Props) {
  return (
    <section className="space-y-2">
      <EditorSectionHeader title="Section titles" />
      <p className="text-[11px] leading-4 text-[#8a8a8a]">
        Override section labels and headlines. Leave blank to use language
        defaults.
      </p>
      {HOMEPAGE_SECTION_KEYS.map((sectionKey) => {
        const fields = HOMEPAGE_SECTION_TITLE_FIELDS[sectionKey];
        if (!fields.length) return null;
        return (
        <EditorFieldCard key={sectionKey}>
          <p className="text-[11px] font-medium text-[#1a1a1a]">
            {HOMEPAGE_SECTION_LABELS[sectionKey]}
          </p>
          {fields.map((field) => {
            const arKey = arFieldKey(field.key);
            return (
              <BilingualField
                key={field.key}
                label={field.label}
                valueEn={String(settings[field.key] ?? "")}
                valueAr={String(settings[arKey] ?? "")}
                onChangeEn={(value) =>
                  patchSettings({
                    [field.key]: value,
                  } as Partial<SiteSettings>)
                }
                onChangeAr={(value) =>
                  patchSettings({ [arKey]: value } as Partial<SiteSettings>)
                }
                multiline={field.multiline}
                idPrefix={`${sectionKey}-${String(field.key)}`}
              />
            );
          })}
        </EditorFieldCard>
        );
      })}
    </section>
  );
}
