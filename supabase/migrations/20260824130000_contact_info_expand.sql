-- Expand contact info for the site popup (adds copy + richer details)
-- Builds on 20260824120000_contact_info_fields.sql

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_headline text NOT NULL DEFAULT 'Get in touch',
  ADD COLUMN IF NOT EXISTS contact_blurb text NOT NULL DEFAULT
    'For collaborations, commissions, and studio inquiries.',
  ADD COLUMN IF NOT EXISTS contact_city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_country text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_hours text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_map_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_phone_secondary text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_email_secondary text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.site_settings.contact_email IS
  'Primary contact email shown in the contact popup';
COMMENT ON COLUMN public.site_settings.contact_phone IS
  'Primary phone number (tel: link)';
COMMENT ON COLUMN public.site_settings.contact_phone_secondary IS
  'Optional second phone line';
COMMENT ON COLUMN public.site_settings.contact_email_secondary IS
  'Optional second email';
COMMENT ON COLUMN public.site_settings.contact_address IS
  'Full street / studio address';
COMMENT ON COLUMN public.site_settings.contact_city IS
  'City label for contact popup';
COMMENT ON COLUMN public.site_settings.contact_country IS
  'Country label for contact popup';
COMMENT ON COLUMN public.site_settings.contact_hours IS
  'Working hours text (e.g. Sun–Thu 10:00–18:00)';
COMMENT ON COLUMN public.site_settings.contact_map_url IS
  'Maps deep link (Google Maps / Apple Maps URL)';
COMMENT ON COLUMN public.site_settings.contact_whatsapp IS
  'WhatsApp number or full https://wa.me/ URL';
COMMENT ON COLUMN public.site_settings.contact_telegram IS
  'Telegram @handle or full https://t.me/ URL';
COMMENT ON COLUMN public.site_settings.contact_headline IS
  'Popup title';
COMMENT ON COLUMN public.site_settings.contact_blurb IS
  'Short supporting line under the popup title';

-- Seed usable defaults when empty (keeps any values already edited)
UPDATE public.site_settings
SET
  contact_headline = CASE
    WHEN contact_headline IS NULL OR btrim(contact_headline) = ''
      THEN 'Get in touch'
    ELSE contact_headline
  END,
  contact_blurb = CASE
    WHEN contact_blurb IS NULL OR btrim(contact_blurb) = ''
      THEN 'For collaborations, commissions, and studio inquiries.'
    ELSE contact_blurb
  END,
  contact_phone = CASE
    WHEN contact_phone IS NULL OR btrim(contact_phone) = ''
      THEN '+966 11 000 0000'
    ELSE contact_phone
  END,
  contact_address = CASE
    WHEN contact_address IS NULL OR btrim(contact_address) = ''
      THEN 'Studio district, King Fahd Road'
    ELSE contact_address
  END,
  contact_city = CASE
    WHEN contact_city IS NULL OR btrim(contact_city) = ''
      THEN 'Riyadh'
    ELSE contact_city
  END,
  contact_country = CASE
    WHEN contact_country IS NULL OR btrim(contact_country) = ''
      THEN 'Saudi Arabia'
    ELSE contact_country
  END,
  contact_hours = CASE
    WHEN contact_hours IS NULL OR btrim(contact_hours) = ''
      THEN 'Sun–Thu · 10:00–18:00'
    ELSE contact_hours
  END,
  contact_map_url = CASE
    WHEN contact_map_url IS NULL OR btrim(contact_map_url) = ''
      THEN 'https://maps.google.com/?q=Riyadh'
    ELSE contact_map_url
  END,
  contact_whatsapp = CASE
    WHEN contact_whatsapp IS NULL OR btrim(contact_whatsapp) = ''
      THEN '+966500000000'
    ELSE contact_whatsapp
  END,
  contact_telegram = CASE
    WHEN contact_telegram IS NULL OR btrim(contact_telegram) = ''
      THEN 'imagineerstudio'
    ELSE contact_telegram
  END,
  updated_at = now()
WHERE true;
