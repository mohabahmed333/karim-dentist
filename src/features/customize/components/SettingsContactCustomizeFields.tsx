"use client";

import type { SiteSettings } from "@/services/site_settings";
import { CONTACT_SETTING_FIELDS } from "@/features/admin/lib/contactSettingFields";
import { ControlledField } from "./ControlledField";

type Props = {
  settings: SiteSettings;
  patchSettings: (partial: Partial<SiteSettings>) => void;
};

export function SettingsContactCustomizeFields({
  settings,
  patchSettings,
}: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] leading-relaxed text-[#8a8a8a]">
        These fields power the contact popup across the site.
      </p>
      {CONTACT_SETTING_FIELDS.map((field) => (
        <ControlledField
          key={field.id}
          label={field.label}
          value={String(settings[field.id] ?? "")}
          onChange={(next) => patchSettings({ [field.id]: next })}
        />
      ))}
    </div>
  );
}
