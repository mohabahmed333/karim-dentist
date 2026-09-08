import { createClient } from "@/lib/supabase/client";
import type { SiteSettings, SiteSettingsUpdate } from "./types";

export async function updateSettings(
  id: string,
  payload: SiteSettingsUpdate,
): Promise<SiteSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createSettings(
  payload: SiteSettingsUpdate,
): Promise<SiteSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .insert({
      brand_name: payload.brand_name ?? "Imagineer",
      brand_logo_url: payload.brand_logo_url ?? "/design/brand-logo.png",
      footer_tagline:
        payload.footer_tagline ?? "The Tales We Hold Within",
      contact_email: payload.contact_email ?? "hello@imagineer.studio",
      contact_email_secondary: payload.contact_email_secondary ?? "",
      contact_phone: payload.contact_phone ?? "",
      contact_phone_secondary: payload.contact_phone_secondary ?? "",
      contact_address: payload.contact_address ?? "",
      contact_city: payload.contact_city ?? "",
      contact_country: payload.contact_country ?? "",
      contact_hours: payload.contact_hours ?? "",
      contact_map_url: payload.contact_map_url ?? "",
      contact_whatsapp: payload.contact_whatsapp ?? "",
      contact_telegram: payload.contact_telegram ?? "",
      contact_behance: payload.contact_behance ?? "",
      contact_linkedin: payload.contact_linkedin ?? "",
      contact_instagram: payload.contact_instagram ?? "",
      contact_facebook: payload.contact_facebook ?? "",
      contact_x: payload.contact_x ?? "",
      contact_mobile: payload.contact_mobile ?? "",
      contact_headline: payload.contact_headline ?? "Get in touch",
      contact_blurb:
        payload.contact_blurb ??
        "For collaborations, commissions, and studio inquiries.",
      case_studies_title: payload.case_studies_title ?? "Case Studies",
      case_studies_description:
        payload.case_studies_description ??
        "Once upon a time, in a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil.",
      featured_title: payload.featured_title ?? "Featured Projects",
      featured_description:
        payload.featured_description ??
        "Once upon a time, in a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil.",
      homepage_section_order: payload.homepage_section_order ?? [
        "about",
        "case-studies",
        "featured",
        "services",
        "callout",
        "experience",
        "clients",
      ],
      ...(payload.dashboard_layout != null
        ? { dashboard_layout: payload.dashboard_layout }
        : {}),
      ...(payload.dashboard_primary_color
        ? { dashboard_primary_color: payload.dashboard_primary_color }
        : {}),
      ...(payload.dashboard_secondary_color
        ? { dashboard_secondary_color: payload.dashboard_secondary_color }
        : {}),
      ...(payload.dashboard_canvas_color
        ? { dashboard_canvas_color: payload.dashboard_canvas_color }
        : {}),
      ...(payload.dashboard_panel_color
        ? { dashboard_panel_color: payload.dashboard_panel_color }
        : {}),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertSettings(
  existing: SiteSettings | null,
  payload: SiteSettingsUpdate,
): Promise<SiteSettings> {
  if (existing) return updateSettings(existing.id, payload);
  return createSettings(payload);
}
