-- Add right-column copy panel image (reference design uses an image, not HTML text).
-- Rollback: ALTER TABLE public.about DROP COLUMN IF EXISTS copy_image_url;
--           ALTER TABLE public.about DROP COLUMN IF EXISTS copy_media_type;

ALTER TABLE public.about
  ADD COLUMN IF NOT EXISTS copy_image_url text,
  ADD COLUMN IF NOT EXISTS copy_media_type text NOT NULL DEFAULT 'image'
    CHECK (copy_media_type IN ('image', 'video'));
