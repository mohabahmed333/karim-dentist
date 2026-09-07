-- Mobile + social contact channels for popup, with full seed data

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_mobile text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_behance text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_linkedin text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_instagram text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_facebook text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_x text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.site_settings.contact_mobile IS
  'Mobile / cell number (tel: link)';
COMMENT ON COLUMN public.site_settings.contact_behance IS
  'Behance profile URL';
COMMENT ON COLUMN public.site_settings.contact_linkedin IS
  'LinkedIn profile or company URL';
COMMENT ON COLUMN public.site_settings.contact_instagram IS
  'Instagram profile URL';
COMMENT ON COLUMN public.site_settings.contact_facebook IS
  'Facebook page URL';
COMMENT ON COLUMN public.site_settings.contact_x IS
  'X (Twitter) profile URL';

-- Full Imagineer / Galil seed for contact popup
UPDATE public.site_settings
SET
  contact_headline = 'Get in touch',
  contact_blurb = 'For collaborations, commissions, and studio inquiries.',
  contact_email = 'hello@imagineer.studio',
  contact_email_secondary = 'studio@imagineer.studio',
  contact_phone = '+966 11 234 5678',
  contact_phone_secondary = '+20 2 2345 6789',
  contact_mobile = '+966 50 123 4567',
  contact_address = 'Studio district, King Fahd Road',
  contact_city = 'Riyadh',
  contact_country = 'Saudi Arabia',
  contact_hours = 'Sun–Thu · 10:00–18:00 AST',
  contact_map_url = 'https://maps.google.com/?q=Riyadh+Saudi+Arabia',
  contact_whatsapp = '+966501234567',
  contact_telegram = 'imagineerstudio',
  contact_behance = 'https://www.behance.net/imagineer',
  contact_linkedin = 'https://www.linkedin.com/in/imagineer',
  contact_instagram = 'https://www.instagram.com/imagineer',
  contact_facebook = 'https://www.facebook.com/imagineer',
  contact_x = 'https://x.com/imagineer',
  updated_at = now()
WHERE true;

-- Keep footer Follow icons in sync with contact socials
UPDATE public.footer_links
SET deleted_at = now()
WHERE deleted_at IS NULL
  AND column_key = 'follow';

INSERT INTO public.footer_links (
  column_key, label, href, sort_order, display_mode, icon_key
)
VALUES
  ('follow', 'LinkedIn', 'https://www.linkedin.com/in/imagineer', 1, 'icon', 'linkedin'),
  ('follow', 'Behance', 'https://www.behance.net/imagineer', 2, 'icon', 'behance'),
  ('follow', 'Instagram', 'https://www.instagram.com/imagineer', 3, 'icon', 'instagram'),
  ('follow', 'Facebook', 'https://www.facebook.com/imagineer', 4, 'icon', 'facebook'),
  ('follow', 'X', 'https://x.com/imagineer', 5, 'icon', 'x');

UPDATE public.social_links
SET deleted_at = now()
WHERE deleted_at IS NULL;

INSERT INTO public.social_links (platform, href, sort_order)
VALUES
  ('Instagram', 'https://www.instagram.com/imagineer', 1),
  ('Behance', 'https://www.behance.net/imagineer', 2),
  ('LinkedIn', 'https://www.linkedin.com/in/imagineer', 3),
  ('Facebook', 'https://www.facebook.com/imagineer', 4),
  ('X', 'https://x.com/imagineer', 5),
  ('WhatsApp', 'https://wa.me/966501234567', 6),
  ('Telegram', 'https://t.me/imagineerstudio', 7);
