"use client";

import type { SiteSettings } from "@/services/site_settings";
import { MediaUploadField } from "./MediaUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  settings: SiteSettings | null;
  cardImageUrl: string;
  onCardImageChange: (url: string) => void;
};

/** Admin form fields for clinic/doctor card (uncontrolled inputs + image state). */
export function ContactCardAdminFields({
  settings,
  cardImageUrl,
  onCardImageChange,
}: Props) {
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <p className="text-sm font-medium">Business card</p>
      <div className="space-y-2">
        <Label htmlFor="contact_clinic_name">Clinic name</Label>
        <Input
          id="contact_clinic_name"
          name="contact_clinic_name"
          defaultValue={settings?.contact_clinic_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_clinic_name_ar">Clinic name (AR)</Label>
        <Input
          id="contact_clinic_name_ar"
          name="contact_clinic_name_ar"
          defaultValue={settings?.contact_clinic_name_ar ?? ""}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_doctor_name">Doctor name</Label>
        <Input
          id="contact_doctor_name"
          name="contact_doctor_name"
          defaultValue={settings?.contact_doctor_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_doctor_name_ar">Doctor name (AR)</Label>
        <Input
          id="contact_doctor_name_ar"
          name="contact_doctor_name_ar"
          defaultValue={settings?.contact_doctor_name_ar ?? ""}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_credentials">Credentials (one per line)</Label>
        <Textarea
          id="contact_credentials"
          name="contact_credentials"
          rows={4}
          defaultValue={settings?.contact_credentials ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_credentials_ar">Credentials (AR)</Label>
        <Textarea
          id="contact_credentials_ar"
          name="contact_credentials_ar"
          rows={4}
          defaultValue={settings?.contact_credentials_ar ?? ""}
          dir="rtl"
        />
      </div>
      <MediaUploadField
        label="Business card image"
        bucket="about"
        folder="contact"
        mediaType="image"
        onMediaTypeChange={() => undefined}
        value={cardImageUrl || null}
        onChange={(url) => onCardImageChange(url ?? "")}
      />
      {cardImageUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onCardImageChange("")}
        >
          Clear image (use default)
        </Button>
      ) : null}
    </div>
  );
}
