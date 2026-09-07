-- Optional script-title image for the hero headline stack.
ALTER TABLE public.hero
  ADD COLUMN IF NOT EXISTS headline_image_url text;
