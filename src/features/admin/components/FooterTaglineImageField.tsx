"use client";

import { MediaUploadField } from "./MediaUploadField";
import { useTranslations } from "@/lib/i18n";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function FooterTaglineImageField({ value, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <MediaUploadField
        label={t("admin.pages.footer.keywordImage")}
        bucket="hero"
        folder="footer"
        mediaType="image"
        onMediaTypeChange={() => undefined}
        value={value}
        onChange={onChange}
        removeLabel={t("admin.pages.footer.removeKeywordImage")}
      />
      <p className="text-[11px] text-muted-foreground">
        {t("admin.pages.footer.keywordImageHint")}
      </p>
    </div>
  );
}
