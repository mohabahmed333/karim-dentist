-- Bilingual CMS copy (*_ar) for Customize + public locale.
-- Rollback: DROP COLUMN for each *_ar added below.

-- hero
ALTER TABLE public.hero
  ADD COLUMN IF NOT EXISTS kicker_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS headline_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS accent_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS body_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_primary_label_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS cta_secondary_label_ar text NOT NULL DEFAULT '';

-- about
ALTER TABLE public.about
  ADD COLUMN IF NOT EXISTS body_ar text NOT NULL DEFAULT '';

-- about trust row
ALTER TABLE public.about_trust_items
  ADD COLUMN IF NOT EXISTS value_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS label_ar text NOT NULL DEFAULT '';

-- solution panels
ALTER TABLE public.solution_panels
  ADD COLUMN IF NOT EXISTS title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS body_ar text NOT NULL DEFAULT '';

-- gallery captions
ALTER TABLE public.gallery_items
  ADD COLUMN IF NOT EXISTS caption_ar text NOT NULL DEFAULT '';

-- callouts
ALTER TABLE public.callouts
  ADD COLUMN IF NOT EXISTS body_ar text NOT NULL DEFAULT '';

-- site_settings section copy
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS footer_tagline_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_headline_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_blurb_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS about_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solutions_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS solutions_description_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS services_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS services_heading_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS services_description_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_heading_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS gallery_description_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS featured_description_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS slider_heading_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS case_studies_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS case_studies_description_ar text NOT NULL DEFAULT '';
