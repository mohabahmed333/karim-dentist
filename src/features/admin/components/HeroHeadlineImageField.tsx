"use client";

import { useTranslations } from "@/lib/i18n";
import { MediaUploadField } from "./MediaUploadField";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function HeroHeadlineImageField({ value, onChange }: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-2">
      <MediaUploadField
        label={t("admin.customize.scriptTitleImage")}
        bucket="hero"
        folder="headline"
        mediaType="image"
        onMediaTypeChange={() => undefined}
        value={value}
        onChange={onChange}
        removeLabel={t("admin.customize.removeTitleImage")}
      />
      <p className="text-[11px] text-muted-foreground">
        {t("admin.customize.scriptTitleHint")}
      </p>
    </div>
  );
}
