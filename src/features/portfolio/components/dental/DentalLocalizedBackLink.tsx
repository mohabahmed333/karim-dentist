"use client";

import { DentalBackLink } from "./DentalBackLink";
import { pickLocalized, useLocale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n/localePath";

type Props = {
  href: string;
  label: string;
  labelAr?: string | null;
  onBackClick?: () => void;
};

export function DentalLocalizedBackLink({
  href,
  label,
  labelAr,
  onBackClick,
}: Props) {
  const { locale } = useLocale();
  return (
    <DentalBackLink
      href={localePath(locale, href)}
      label={pickLocalized(locale, label, labelAr) || label}
      onBackClick={onBackClick}
    />
  );
}
