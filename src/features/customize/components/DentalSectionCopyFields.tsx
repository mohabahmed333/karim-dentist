"use client";

import type { SiteSettings } from "@/services/site_settings";
import type { HomepageSectionKey } from "@/features/portfolio/lib/homepageSectionOrder";
import { HOMEPAGE_SECTION_TITLE_FIELDS } from "@/features/portfolio/lib/homepageSectionNav";
import { BilingualField } from "./BilingualField";
import { EditorFieldShell } from "./EditorFieldShell";

type Props = {
  section: HomepageSectionKey;
  settings: SiteSettings;
  patchSettings: (patch: Partial<SiteSettings>) => void;
};

function arFieldKey(key: keyof SiteSettings): keyof SiteSettings {
  return `${String(key)}_ar` as keyof SiteSettings;
}

export function DentalSectionCopyFields({
  section,
  settings,
  patchSettings,
}: Props) {
  return (
    <div className="space-y-2">
      {HOMEPAGE_SECTION_TITLE_FIELDS[section].map((field) => {
        const arKey = arFieldKey(field.key);
        return (
          <EditorFieldShell key={field.key} field={field.key}>
            <BilingualField
              label={field.label}
              valueEn={String(settings[field.key] ?? "")}
              valueAr={String(settings[arKey] ?? "")}
              onChangeEn={(value) =>
                patchSettings({ [field.key]: value } as Partial<SiteSettings>)
              }
              onChangeAr={(value) =>
                patchSettings({ [arKey]: value } as Partial<SiteSettings>)
              }
              multiline={field.multiline}
              idPrefix={String(field.key)}
            />
          </EditorFieldShell>
        );
      })}
    </div>
  );
}
