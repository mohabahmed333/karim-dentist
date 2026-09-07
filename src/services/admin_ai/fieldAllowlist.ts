/** Allowlisted CMS singleton tables and editable columns. */
export const CMS_SINGLETONS = {
  hero: [
    "title",
    "title_line_1",
    "title_line_2",
    "title_line_3",
    "subtitle",
    "cta_label",
    "cta_href",
    "desktop_media_url",
    "mobile_media_url",
    "headline_image_url",
    "media_type",
  ],
  about: [
    "drop_cap",
    "body",
    "image_url",
    "media_type",
    "copy_image_url",
    "copy_media_type",
    "drop_cap_logo_url",
  ],
  callouts: [
    "eyebrow",
    "title",
    "body",
    "cta_label",
    "cta_href",
    "lead_image_url",
  ],
  site_settings: [
    "brand_name",
    "brand_logo_url",
    "footer_tagline",
    "footer_tagline_image_url",
    "contact_email",
    "contact_email_secondary",
    "contact_phone",
    "contact_phone_secondary",
    "contact_address",
    "contact_city",
    "contact_country",
    "contact_hours",
    "contact_map_url",
    "contact_whatsapp",
    "contact_telegram",
    "contact_behance",
    "contact_linkedin",
    "contact_instagram",
    "contact_facebook",
    "contact_x",
    "contact_mobile",
    "contact_headline",
    "contact_blurb",
    "case_studies_title",
    "case_studies_description",
    "featured_title",
    "featured_description",
    "homepage_section_order",
    "dashboard_primary_color",
    "dashboard_secondary_color",
  ],
  gallery_showcase: ["image_url", "alt_text"],
} as const;

export type CmsSingletonTable = keyof typeof CMS_SINGLETONS;

export const CMS_COLLECTIONS = {
  services: ["title", "description", "icon", "sort_order", "published", "kind"],
  clients: ["name", "logo_url", "sort_order", "published"],
  experience_entries: [
    "role",
    "company",
    "period",
    "description",
    "sort_order",
    "published",
  ],
  footer_links: ["label", "label_ar", "href", "sort_order", "published"],
  social_links: ["platform", "href", "sort_order", "published"],
  case_studies: [
    "title",
    "slug",
    "summary",
    "cover_url",
    "sort_order",
    "published",
  ],
  featured_projects: [
    "title",
    "slug",
    "summary",
    "cover_url",
    "sort_order",
    "published",
  ],
  gallery_items: [
    "title",
    "image_url",
    "caption",
    "category",
    "sort_order",
    "is_published",
    "caption_ar",
  ],
  gallery_comparisons: [
    "before_image_url",
    "after_image_url",
    "alt_text",
    "sort_order",
    "is_published",
  ],
  about_trust_items: ["label", "value", "label_ar", "value_ar", "sort_order"],
  solution_panels: [
    "title",
    "body",
    "image_url",
    "variant",
    "link_href",
    "sort_order",
    "title_ar",
    "body_ar",
  ],
} as const;

export type CmsCollectionTable = keyof typeof CMS_COLLECTIONS;

export function pickAllowedFields(
  allowed: readonly string[],
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      out[key] = payload[key];
    }
  }
  return out;
}

export function assertAllowedFields(
  allowed: readonly string[],
  payload: Record<string, unknown>,
): void {
  const unknown = Object.keys(payload).filter((k) => !allowed.includes(k));
  if (unknown.length > 0) {
    throw new Error(`Disallowed fields: ${unknown.join(", ")}`);
  }
}
