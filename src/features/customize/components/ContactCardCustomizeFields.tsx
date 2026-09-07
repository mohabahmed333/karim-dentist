"use client";

import type { SiteSettings } from "@/services/site_settings";
import { MediaUploadField } from "@/features/admin/components/MediaUploadField";
import { Button } from "@/components/ui/button";
import { BilingualField } from "@/features/customize/components/BilingualField";
import { EditorFieldShell } from "@/features/customize/components/EditorFieldShell";

type Props = {
  settings: SiteSettings;
  patchSettings: (partial: Partial<SiteSettings>) => void;
};

/** Clinic / doctor card fields for Customize (and reusable labels). */
export function ContactCardCustomizeFields({ settings, patchSettings }: Props) {
  return (
    <div className="space-y-3">
      <EditorFieldShell field="contact_clinic_name">
        <BilingualField
          label="Clinic name"
          valueEn={settings.contact_clinic_name ?? ""}
          valueAr={settings.contact_clinic_name_ar ?? ""}
          onChangeEn={(contact_clinic_name) =>
            patchSettings({ contact_clinic_name })
          }
          onChangeAr={(contact_clinic_name_ar) =>
            patchSettings({ contact_clinic_name_ar })
          }
          idPrefix="contact-clinic"
        />
      </EditorFieldShell>
      <EditorFieldShell field="contact_doctor_name">
        <BilingualField
          label="Doctor name"
          valueEn={settings.contact_doctor_name ?? ""}
          valueAr={settings.contact_doctor_name_ar ?? ""}
          onChangeEn={(contact_doctor_name) =>
            patchSettings({ contact_doctor_name })
          }
          onChangeAr={(contact_doctor_name_ar) =>
            patchSettings({ contact_doctor_name_ar })
          }
          idPrefix="contact-doctor"
        />
      </EditorFieldShell>
      <EditorFieldShell field="contact_credentials">
        <BilingualField
          label="Credentials (one per line)"
          valueEn={settings.contact_credentials ?? ""}
          valueAr={settings.contact_credentials_ar ?? ""}
          onChangeEn={(contact_credentials) =>
            patchSettings({ contact_credentials })
          }
          onChangeAr={(contact_credentials_ar) =>
            patchSettings({ contact_credentials_ar })
          }
          multiline
          idPrefix="contact-credentials"
        />
      </EditorFieldShell>
      <EditorFieldShell field="contact_card_image_url">
        <MediaUploadField
          label="Business card image"
          bucket="about"
          folder="contact"
          mediaType="image"
          onMediaTypeChange={() => undefined}
          value={settings.contact_card_image_url}
          onChange={(url) =>
            patchSettings({ contact_card_image_url: url || null })
          }
        />
        {settings.contact_card_image_url ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1"
            onClick={() => patchSettings({ contact_card_image_url: null })}
          >
            Clear image (use default)
          </Button>
        ) : null}
      </EditorFieldShell>
    </div>
  );
}
