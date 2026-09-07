import type { SiteSettings } from "@/services/site_settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_SETTING_FIELDS } from "../lib/contactSettingFields";

type Props = { settings: SiteSettings | null };

export function SettingsContactFields({ settings }: Props) {
  return (
    <>
      <p className="pt-2 text-sm font-medium">Contact popup</p>
      {CONTACT_SETTING_FIELDS.map((field) => {
        const value = String(settings?.[field.id] ?? "");
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{field.label}</Label>
            {"multiline" in field && field.multiline ? (
              <Textarea
                id={field.id}
                name={field.id}
                rows={3}
                defaultValue={value}
              />
            ) : (
              <Input id={field.id} name={field.id} defaultValue={value} />
            )}
          </div>
        );
      })}
    </>
  );
}
