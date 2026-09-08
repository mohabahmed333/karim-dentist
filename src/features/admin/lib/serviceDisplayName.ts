import type { Locale } from "@/lib/i18n/LocaleProvider";
import { pickLocalized } from "@/lib/i18n/pickLocalized";

/** Canonical English label persisted on reservations for consultation. */
export const GENERAL_CONSULTATION_LABEL_EN = "General consultation";

export type ServiceNameFields = {
  id?: string;
  title: string;
  title_ar?: string | null;
};

export function serviceDisplayName(
  locale: Locale,
  service: ServiceNameFields,
): string {
  return pickLocalized(locale, service.title, service.title_ar);
}

export function isGeneralConsultationLabel(label: string | null | undefined): boolean {
  const v = (label ?? "").trim().toLowerCase();
  if (!v) return false;
  return (
    v === GENERAL_CONSULTATION_LABEL_EN.toLowerCase() ||
    v === "consultation" ||
    v === "استشارة عامة"
  );
}

/** Localized label for UI; prefers live catalog via service_id. */
export function resolveServiceLabel(opts: {
  locale: Locale;
  serviceId: string | null | undefined;
  storedLabel: string | null | undefined;
  services: ServiceNameFields[];
  consultationLabel: string;
}): string {
  const { locale, serviceId, storedLabel, services, consultationLabel } = opts;
  if (serviceId) {
    const match = services.find((s) => s.id === serviceId);
    if (match) return serviceDisplayName(locale, match);
  }
  if (isGeneralConsultationLabel(storedLabel) || !storedLabel?.trim()) {
    return consultationLabel;
  }
  return storedLabel.trim();
}

/** Value stored on reservation.service_label (stable English). */
export function persistServiceLabel(
  service: ServiceNameFields | null | undefined,
): string {
  if (!service) return GENERAL_CONSULTATION_LABEL_EN;
  return (service.title || GENERAL_CONSULTATION_LABEL_EN).trim();
}
