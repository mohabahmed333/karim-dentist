-- Contact info fields for popup (email already exists)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_phone text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_whatsapp text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS contact_telegram text NOT NULL DEFAULT '';
