-- Optional script image for the footer left keyword (falls back to tagline text).
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS footer_tagline_image_url text;
