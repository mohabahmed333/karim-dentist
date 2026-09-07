-- Add desktop + mobile hero media URLs
-- Rollback: ALTER TABLE public.hero DROP COLUMN IF EXISTS media_url_desktop, DROP COLUMN IF EXISTS media_url_mobile;

ALTER TABLE public.hero
  ADD COLUMN IF NOT EXISTS media_url_desktop text,
  ADD COLUMN IF NOT EXISTS media_url_mobile text;

-- Prefer legacy media_url as desktop when new cols empty
UPDATE public.hero
SET
  media_type = 'video',
  media_url_desktop = COALESCE(media_url_desktop, media_url, '/hero/desktop.mp4'),
  media_url_mobile = COALESCE(media_url_mobile, '/hero/mobile.mp4'),
  media_url = COALESCE(media_url, '/hero/desktop.mp4'),
  headline = COALESCE(NULLIF(headline, ''), 'Galil —'),
  accent = COALESCE(NULLIF(accent, ''), 'design that moves'),
  body = CASE
    WHEN body IS NULL OR body = '' THEN
      'Cinematic brand films, product stories, and craft from Cairo to Riyadh — work built to feel intentional.'
    ELSE body
  END,
  updated_at = now();
