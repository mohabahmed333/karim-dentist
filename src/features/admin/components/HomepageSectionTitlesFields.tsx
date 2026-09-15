"use client";

import type { SiteSettings } from "@/services/site_settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";
import {
  HOMEPAGE_SECTION_KEYS,
  type HomepageSectionKey,
} from "@/features/portfolio/lib/homepageSectionOrder";
import { HOMEPAGE_SECTION_TITLE_FIELDS } from "@/features/portfolio/lib/homepageSectionNav";

type Props = {
  settings: SiteSettings;
  onChange: (patch: Partial<SiteSettings>) => void;
};

const SECTION_LABEL_KEYS: Record<HomepageSectionKey, AdminMessageKey> = {
  about: "admin.customize.section.about",
  services: "admin.customize.section.services",
  gallery: "admin.customize.section.gallery",
  slider: "admin.customize.section.slider",
  "case-studies": "admin.customize.section.caseStudies",
  featured: "admin.customize.section.featured",
  faq: "admin.customize.section.faq",
  contact: "admin.customize.section.contact",
};

const FIELD_LABEL_KEYS: Record<string, AdminMessageKey> = {
  "Section label": "admin.pages.homepage.sectionLabel",
  "Section headline": "admin.pages.homepage.sectionHeadline",
  "Section intro": "admin.pages.homepage.sectionIntro",
  "Services label": "admin.pages.homepage.servicesLabel",
  "Services headline": "admin.pages.homepage.servicesHeadline",
  "Services intro": "admin.pages.homepage.servicesIntro",
  "Solutions headline": "admin.pages.homepage.solutionsHeadline",
  "Solutions intro": "admin.pages.homepage.solutionsIntro",
};

export function HomepageSectionTitlesFields({ settings, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-6">
      {HOMEPAGE_SECTION_KEYS.map((sectionKey) => {
        const fields = HOMEPAGE_SECTION_TITLE_FIELDS[sectionKey];
        if (!fields.length) return null;
        return (
        <div key={sectionKey} className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">{t(SECTION_LABEL_KEYS[sectionKey])}</h3>
          {fields.map((field) => {
            const value = String(settings[field.key] ?? "");
            const labelKey = FIELD_LABEL_KEYS[field.label];
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`section-title-${field.key}`}>
                  {labelKey ? t(labelKey) : field.label}
                </Label>
                {field.multiline ? (
                  <Textarea
                    id={`section-title-${field.key}`}
                    value={value}
                    rows={3}
                    onChange={(event) =>
                      onChange({ [field.key]: event.target.value } as Partial<SiteSettings>)
                    }
                  />
                ) : (
                  <Input
                    id={`section-title-${field.key}`}
                    value={value}
                    onChange={(event) =>
                      onChange({ [field.key]: event.target.value } as Partial<SiteSettings>)
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
        );
      })}
    </div>
  );
}
