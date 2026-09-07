-- Optional script image for the callout big text (falls back to lead copy).
ALTER TABLE public.callouts
  ADD COLUMN IF NOT EXISTS lead_image_url text;
