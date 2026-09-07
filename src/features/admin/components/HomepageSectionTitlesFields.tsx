"use client";

import type { SiteSettings } from "@/services/site_settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  HOMEPAGE_SECTION_KEYS,
  HOMEPAGE_SECTION_LABELS,
} from "@/features/portfolio/lib/homepageSectionOrder";
import { HOMEPAGE_SECTION_TITLE_FIELDS } from "@/features/portfolio/lib/homepageSectionNav";

type Props = {
  settings: SiteSettings;
  onChange: (patch: Partial<SiteSettings>) => void;
};

export function HomepageSectionTitlesFields({ settings, onChange }: Props) {
  return (
    <div className="space-y-6">
      {HOMEPAGE_SECTION_KEYS.map((sectionKey) => {
        const fields = HOMEPAGE_SECTION_TITLE_FIELDS[sectionKey];
        if (!fields.length) return null;
        return (
        <div key={sectionKey} className="space-y-3 rounded-lg border border-border p-4">
          <h3 className="text-sm font-semibold">{HOMEPAGE_SECTION_LABELS[sectionKey]}</h3>
          {fields.map((field) => {
            const value = String(settings[field.key] ?? "");
            return (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={`section-title-${field.key}`}>{field.label}</Label>
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
