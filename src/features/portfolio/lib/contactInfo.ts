export type ContactInfo = {
  headline: string;
  blurb: string;
  email: string;
  emailSecondary: string;
  phone: string;
  phoneSecondary: string;
  mobile: string;
  address: string;
  city: string;
  country: string;
  hours: string;
  mapUrl: string;
  whatsapp: string;
  telegram: string;
  behance: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  x: string;
};

type SettingsLike = {
  contact_email?: string | null;
  contact_email_secondary?: string | null;
  contact_phone?: string | null;
  contact_phone_secondary?: string | null;
  contact_mobile?: string | null;
  contact_address?: string | null;
  contact_city?: string | null;
  contact_country?: string | null;
  contact_hours?: string | null;
  contact_map_url?: string | null;
  contact_whatsapp?: string | null;
  contact_telegram?: string | null;
  contact_behance?: string | null;
  contact_linkedin?: string | null;
  contact_instagram?: string | null;
  contact_facebook?: string | null;
  contact_x?: string | null;
  contact_headline?: string | null;
  contact_blurb?: string | null;
} | null;

function text(value: string | null | undefined, fallback = "") {
  return value?.trim() || fallback;
}

export function contactFromSettings(settings: SettingsLike): ContactInfo {
  return {
    headline: text(settings?.contact_headline, "Get in touch"),
    blurb: text(
      settings?.contact_blurb,
      "For collaborations, commissions, and studio inquiries.",
    ),
    email: text(settings?.contact_email, "hello@imagineer.studio"),
    emailSecondary: text(settings?.contact_email_secondary),
    phone: text(settings?.contact_phone),
    phoneSecondary: text(settings?.contact_phone_secondary),
    mobile: text(settings?.contact_mobile),
    address: text(settings?.contact_address),
    city: text(settings?.contact_city),
    country: text(settings?.contact_country),
    hours: text(settings?.contact_hours),
    mapUrl: text(settings?.contact_map_url),
    whatsapp: text(settings?.contact_whatsapp),
    telegram: text(settings?.contact_telegram),
    behance: text(settings?.contact_behance),
    linkedin: text(settings?.contact_linkedin),
    instagram: text(settings?.contact_instagram),
    facebook: text(settings?.contact_facebook),
    x: text(settings?.contact_x),
  };
}

export function whatsappHref(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

export function telegramHref(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const handle = value.replace(/^@/, "");
  return handle ? `https://t.me/${handle}` : "";
}

export function telHref(phone: string) {
  if (!phone) return "";
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export function locationLine(contact: ContactInfo) {
  return [contact.city, contact.country].filter(Boolean).join(", ");
}

export function externalHref(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value.replace(/^\/+/, "")}`;
}
