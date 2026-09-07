-- Editable contact clinic/doctor card fields + optional card image
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_clinic_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_clinic_name_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_doctor_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_doctor_name_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_credentials text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_credentials_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_card_image_url text;

UPDATE public.site_settings
SET
  contact_clinic_name = COALESCE(NULLIF(contact_clinic_name, ''), brand_name, 'The Dental Lounge'),
  contact_doctor_name = COALESCE(
    NULLIF(contact_doctor_name, ''),
    'Dr / Karim Elshibiny'
  ),
  contact_credentials = COALESCE(
    NULLIF(contact_credentials, ''),
    E'Mastership Laser Dentistry - Aachen, Germany\nMembership of American dental association of cosmetic dentistry'
  ),
  contact_card_image_url = COALESCE(
    contact_card_image_url,
    '/dental/768432495_18084585374253727_8866675210638190928_n.webp'
  );
