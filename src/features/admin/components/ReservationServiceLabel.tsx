"use client";

import { useLocale, useTranslations } from "@/lib/i18n";
import { resolveServiceLabel } from "@/features/admin/lib/serviceDisplayName";
import type { Service } from "@/services/services/types";

type Props = {
  serviceId?: string | null;
  storedLabel?: string | null;
  services?: Service[];
  className?: string;
};

/** Localized reservation/service label for display. */
export function ReservationServiceLabel({
  serviceId,
  storedLabel,
  services = [],
  className,
}: Props) {
  const { locale } = useLocale();
  const t = useTranslations();
  const label = resolveServiceLabel({
    locale,
    serviceId,
    storedLabel,
    services,
    consultationLabel: t("admin.chat.generalConsultation"),
  });
  return <span className={className}>{label}</span>;
}
