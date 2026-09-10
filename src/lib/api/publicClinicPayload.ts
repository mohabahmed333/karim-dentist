import {
  externalHref,
  telegramHref,
  whatsappHref,
} from "@/features/portfolio/lib/contactInfo";
import {
  formatOpeningHoursText,
  openingHoursSpecification,
  type ClinicHoursInput,
} from "@/lib/seo/openingHours";

type SettingsInput = {
  brand_name?: string | null;
  contact_clinic_name?: string | null;
  contact_clinic_name_ar?: string | null;
  contact_doctor_name?: string | null;
  contact_doctor_name_ar?: string | null;
  contact_credentials?: string | null;
  contact_credentials_ar?: string | null;
  contact_address?: string | null;
  contact_city?: string | null;
  contact_country?: string | null;
  contact_phone?: string | null;
  contact_whatsapp?: string | null;
  contact_telegram?: string | null;
  contact_email?: string | null;
  contact_latitude?: number | null;
  contact_longitude?: number | null;
  contact_map_url?: string | null;
  contact_price_range?: string | null;
  contact_instagram?: string | null;
  contact_facebook?: string | null;
  contact_linkedin?: string | null;
  contact_x?: string | null;
  contact_behance?: string | null;
} | null;

type Bilingual = { en: string; ar: string };

export type PublicClinicPayload = {
  name: Bilingual;
  doctor: { name: Bilingual; credentials: Bilingual };
  address: { en: string; city: string; country: string; mapUrl: string | null };
  geo: { latitude: number; longitude: number } | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  priceRange: string | null;
  hours: {
    text: string | null;
    timezone: string;
    specification: ReturnType<typeof openingHoursSpecification>;
  } | null;
  socialLinks: string[];
} | null;

function text(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function bilingual(en: string | null | undefined, ar: string | null | undefined): Bilingual {
  const enText = text(en);
  const arText = text(ar);
  return { en: enText, ar: arText || enText };
}

/** Pure builder for GET /api/v1/public/clinic. Bilingual fields come back
 * as {en, ar} pairs (Arabic falls back to English when blank) rather than
 * requiring a ?locale= query param — an agent gets everything in one call. */
export function buildPublicClinicPayload(
  settings: SettingsInput,
  hours: ClinicHoursInput,
): PublicClinicPayload {
  if (!settings) return null;

  const hasGeo =
    typeof settings.contact_latitude === "number" &&
    typeof settings.contact_longitude === "number";

  const socialLinks = [
    externalHref(text(settings.contact_instagram)),
    externalHref(text(settings.contact_facebook)),
    externalHref(text(settings.contact_linkedin)),
    externalHref(text(settings.contact_x)),
    externalHref(text(settings.contact_behance)),
    whatsappHref(text(settings.contact_whatsapp)),
    telegramHref(text(settings.contact_telegram)),
  ].filter((href): href is string => Boolean(href));

  return {
    name: bilingual(
      settings.contact_clinic_name || settings.brand_name,
      settings.contact_clinic_name_ar,
    ),
    doctor: {
      name: bilingual(settings.contact_doctor_name, settings.contact_doctor_name_ar),
      credentials: bilingual(
        settings.contact_credentials,
        settings.contact_credentials_ar,
      ),
    },
    address: {
      en: text(settings.contact_address),
      city: text(settings.contact_city),
      country: text(settings.contact_country),
      mapUrl: text(settings.contact_map_url) || null,
    },
    geo: hasGeo
      ? {
          latitude: settings.contact_latitude as number,
          longitude: settings.contact_longitude as number,
        }
      : null,
    phone: text(settings.contact_phone) || null,
    whatsapp: whatsappHref(text(settings.contact_whatsapp)) || null,
    email: text(settings.contact_email) || null,
    priceRange: text(settings.contact_price_range) || null,
    hours: hours
      ? {
          text: formatOpeningHoursText(hours),
          timezone: hours.timezone,
          specification: openingHoursSpecification(hours),
        }
      : null,
    socialLinks,
  };
}
