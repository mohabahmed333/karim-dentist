/** Shared labels for admin + customize contact editors. */
export const CONTACT_SETTING_FIELDS = [
  { id: "contact_headline", label: "Headline" },
  { id: "contact_blurb", label: "Intro blurb", multiline: true },
  { id: "contact_email", label: "Email" },
  { id: "contact_email_secondary", label: "Email (alt)" },
  { id: "contact_phone", label: "Phone (landline)" },
  { id: "contact_mobile", label: "Mobile" },
  { id: "contact_phone_secondary", label: "Phone (alt)" },
  { id: "contact_address", label: "Full address", multiline: true },
  { id: "contact_city", label: "City" },
  { id: "contact_country", label: "Country" },
  { id: "contact_hours", label: "Hours" },
  { id: "contact_map_url", label: "Map URL" },
  { id: "contact_whatsapp", label: "WhatsApp (number or URL)" },
  { id: "contact_telegram", label: "Telegram (@handle or URL)" },
  { id: "contact_behance", label: "Behance URL" },
  { id: "contact_linkedin", label: "LinkedIn URL" },
  { id: "contact_instagram", label: "Instagram URL" },
  { id: "contact_facebook", label: "Facebook URL" },
  { id: "contact_x", label: "X (Twitter) URL" },
] as const;

export type ContactSettingFieldId =
  (typeof CONTACT_SETTING_FIELDS)[number]["id"];
