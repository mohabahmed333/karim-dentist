-- Header brand logo (PNG). Optional; falls back to brand_name text when null.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS brand_logo_url text;

UPDATE public.site_settings
SET brand_logo_url = COALESCE(NULLIF(brand_logo_url, ''), '/design/brand-logo.png');
