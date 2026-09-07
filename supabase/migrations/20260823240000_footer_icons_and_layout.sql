-- Footer icon display + refresh Links / Follow Us content
ALTER TABLE public.footer_links
  ADD COLUMN IF NOT EXISTS display_mode text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS icon_key text,
  ADD COLUMN IF NOT EXISTS icon_url text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'footer_links_display_mode_check'
  ) THEN
    ALTER TABLE public.footer_links
      ADD CONSTRAINT footer_links_display_mode_check
      CHECK (display_mode IN ('text', 'icon'));
  END IF;
END $$;

UPDATE public.footer_links
SET deleted_at = now()
WHERE deleted_at IS NULL;

INSERT INTO public.footer_links (column_key, label, href, sort_order, display_mode)
VALUES
  ('portfolio', 'Home', '#top', 1, 'text'),
  ('portfolio', 'Case Studies', '/case-studies', 2, 'text'),
  ('portfolio', 'Featured Projects', '/featured', 3, 'text'),
  ('portfolio', 'About', '#about', 4, 'text'),
  ('portfolio', 'Experience', '#experience', 5, 'text'),
  ('portfolio', 'Contact', '#contact', 6, 'text');

INSERT INTO public.footer_links (
  column_key, label, href, sort_order, display_mode, icon_key
)
VALUES
  ('follow', 'LinkedIn', 'https://linkedin.com', 1, 'icon', 'linkedin'),
  ('follow', 'Behance', 'https://behance.net', 2, 'icon', 'behance'),
  ('follow', 'Instagram', 'https://instagram.com', 3, 'icon', 'instagram'),
  ('follow', 'Facebook', 'https://facebook.com', 4, 'icon', 'facebook'),
  ('follow', 'X', 'https://x.com', 5, 'icon', 'x');

UPDATE public.social_links
SET deleted_at = now()
WHERE deleted_at IS NULL;

UPDATE public.site_settings
SET footer_tagline = 'The Tales We Hold Within'
WHERE footer_tagline IS NULL
  OR footer_tagline = ''
  OR footer_tagline = 'Think. Design. Develop. Launch. Repeat.';
