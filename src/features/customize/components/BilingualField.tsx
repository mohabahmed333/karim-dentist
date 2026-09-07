"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";

type Props = {
  label: string;
  valueAr: string;
  valueEn: string;
  onChangeAr: (value: string) => void;
  onChangeEn: (value: string) => void;
  multiline?: boolean;
  idPrefix?: string;
};

export function BilingualField({
  label,
  valueAr,
  valueEn,
  onChangeAr,
  onChangeEn,
  multiline,
  idPrefix,
}: Props) {
  const t = useTranslations();
  const baseId =
    idPrefix ??
    label.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const arId = `${baseId}-ar`;
  const enId = `${baseId}-en`;
  const fieldClass = "rounded-[4px] shadow-none";

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor={arId} className="text-[11px] text-muted-foreground">
          {label} ({t("admin.customize.langAr")})
        </Label>
        {multiline ? (
          <Textarea
            id={arId}
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            rows={3}
            dir="rtl"
            lang="ar"
            className={fieldClass}
          />
        ) : (
          <Input
            id={arId}
            value={valueAr}
            onChange={(e) => onChangeAr(e.target.value)}
            dir="rtl"
            lang="ar"
            className={`h-8 ${fieldClass}`}
          />
        )}
      </div>
      <div className="space-y-1">
        <Label htmlFor={enId} className="text-[11px] text-muted-foreground">
          {label} ({t("admin.customize.langEn")})
        </Label>
        {multiline ? (
          <Textarea
            id={enId}
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            rows={3}
            dir="ltr"
            lang="en"
            className={fieldClass}
          />
        ) : (
          <Input
            id={enId}
            value={valueEn}
            onChange={(e) => onChangeEn(e.target.value)}
            dir="ltr"
            lang="en"
            className={`h-8 ${fieldClass}`}
          />
        )}
      </div>
    </div>
  );
}
