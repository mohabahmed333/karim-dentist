import type { SiteSettings } from "@/services/site_settings";
import { MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { groupedContactSettingFields } from "../lib/contactSettingFields";

type Props = { settings: SiteSettings | null };

const GROUP_ICONS = {
  location: MapPin,
  contact: Phone,
} as const;

export function SettingsContactFields({ settings }: Props) {
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
              {group.title}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {group.fields.map((field) => {
                const value = String(settings?.[field.id] ?? "");
                const wide = "multiline" in field && field.multiline;
                return (
                  <div
                    key={field.id}
                    className={wide ? "space-y-2 sm:col-span-2" : "space-y-2"}
                  >
                    <Label htmlFor={field.id}>{field.label}</Label>
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
