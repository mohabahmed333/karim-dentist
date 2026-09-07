"use client";

import { DentalBackLink } from "./DentalBackLink";
import { pickLocalized, useLocale } from "@/lib/i18n";

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
      href={href}
      label={pickLocalized(locale, label, labelAr) || label}
      onBackClick={onBackClick}
    />
  );
}
