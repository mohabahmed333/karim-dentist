import type { SiteSettings } from "@/services/site_settings";
import { MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations, type AdminMessageKey } from "@/lib/i18n";
import { groupedContactSettingFields } from "../lib/contactSettingFields";

type Props = { settings: SiteSettings | null };

const GROUP_ICONS = {
  location: MapPin,
  contact: Phone,
} as const;

const GROUP_TITLE_KEYS: Record<keyof typeof GROUP_ICONS, AdminMessageKey> = {
  location: "admin.pages.contactSettings.groupLocation",
  contact: "admin.pages.contactSettings.groupContact",
};

const FIELD_LABEL_KEYS: Record<string, AdminMessageKey> = {
  Headline: "admin.pages.contactSettings.headline",
  "Intro blurb": "admin.pages.contactSettings.blurb",
  Email: "admin.pages.contactSettings.email",
  "Email (alt)": "admin.pages.contactSettings.emailAlt",
  "Phone (landline)": "admin.pages.contactSettings.phoneLandline",
  Mobile: "admin.pages.contactSettings.mobile",
  "Phone (alt)": "admin.pages.contactSettings.phoneAlt",
  "Full address": "admin.pages.contactSettings.fullAddress",
  City: "admin.pages.contactSettings.city",
  Country: "admin.pages.contactSettings.country",
  Hours: "admin.pages.contactSettings.hours",
  "Map URL": "admin.pages.contactSettings.mapUrl",
  "Latitude (for maps + structured data)": "admin.pages.contactSettings.latitude",
  "Longitude (for maps + structured data)": "admin.pages.contactSettings.longitude",
  "Price range (e.g. $$)": "admin.pages.contactSettings.priceRange",
  "WhatsApp (number or URL)": "admin.pages.contactSettings.whatsapp",
  "Telegram (@handle or URL)": "admin.pages.contactSettings.telegram",
  "Behance URL": "admin.pages.contactSettings.behance",
  "LinkedIn URL": "admin.pages.contactSettings.linkedin",
  "Instagram URL": "admin.pages.contactSettings.instagram",
  "Facebook URL": "admin.pages.contactSettings.facebook",
  "X (Twitter) URL": "admin.pages.contactSettings.x",
};

export function SettingsContactFields({ settings }: Props) {
  const t = useTranslations();
  return (
    <div className="grid w-full gap-4 pt-2 lg:grid-cols-2">
      {groupedContactSettingFields().map((group) => {
        const Icon = GROUP_ICONS[group.id];
        return (
          <section
            key={group.id}
            className="min-w-0 rounded-xl border border-(--admin-border,#E5E5E5) bg-(--admin-canvas,#F5F5F7) p-5"
          >
            <p className="mb-4 flex items-center gap-2 text-sm font-medium">
              <Icon
                className="size-4 text-(--admin-primary)"
                aria-hidden
              />
              {t(GROUP_TITLE_KEYS[group.id])}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.fields.map((field) => {
                const value = String(settings?.[field.id] ?? "");
                const wide = "multiline" in field && field.multiline;
                const labelKey = FIELD_LABEL_KEYS[field.label];
                return (
                  <div
                    key={field.id}
                    className={wide ? "space-y-2 sm:col-span-2" : "space-y-2"}
                  >
                    <Label htmlFor={field.id}>{labelKey ? t(labelKey) : field.label}</Label>
                    {wide ? (
                      <Textarea
                        id={field.id}
                        name={field.id}
                        rows={3}
                        defaultValue={value}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        name={field.id}
                        defaultValue={value}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
