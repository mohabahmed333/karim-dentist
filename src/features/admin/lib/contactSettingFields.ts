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

const CONTACT_SETTING_GROUPS = [
  {
    id: "location",
    title: "Location",
    fieldIds: [
      "contact_address",
      "contact_city",
      "contact_country",
      "contact_hours",
      "contact_map_url",
    ],
  },
  {
    id: "contact",
    title: "Contact",
    fieldIds: [
      "contact_headline",
      "contact_blurb",
      "contact_email",
      "contact_email_secondary",
      "contact_phone",
      "contact_mobile",
      "contact_phone_secondary",
      "contact_whatsapp",
      "contact_telegram",
      "contact_behance",
      "contact_linkedin",
      "contact_instagram",
      "contact_facebook",
      "contact_x",
    ],
  },
] as const satisfies ReadonlyArray<{
  id: string;
  title: string;
  fieldIds: readonly ContactSettingFieldId[];
}>;

export function groupedContactSettingFields() {
  return CONTACT_SETTING_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    fields: group.fieldIds.map((id) => {
      const field = CONTACT_SETTING_FIELDS.find((item) => item.id === id);
      if (!field) {
        throw new Error(`Unknown contact setting field: ${id}`);
      }
      return field;
    }),
  }));
}
