-- Bilingual footer link labels.
-- Rollback: ALTER TABLE public.footer_links DROP COLUMN IF EXISTS label_ar;

ALTER TABLE public.footer_links
  ADD COLUMN IF NOT EXISTS label_ar text NOT NULL DEFAULT '';
