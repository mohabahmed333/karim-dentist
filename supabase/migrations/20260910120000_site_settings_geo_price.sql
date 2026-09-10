-- Geo coordinates + price range for LocalBusiness/Dentist structured data.
-- Nullable: omit the JSON-LD `geo` key entirely until both are set, rather
-- than publishing a wrong or default location.
-- Rollback:
--   ALTER TABLE public.site_settings
--     DROP COLUMN IF EXISTS contact_latitude,
--     DROP COLUMN IF EXISTS contact_longitude,
--     DROP COLUMN IF EXISTS contact_price_range;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS contact_latitude numeric,
  ADD COLUMN IF NOT EXISTS contact_longitude numeric,
  ADD COLUMN IF NOT EXISTS contact_price_range text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.site_settings.contact_latitude IS
  'Clinic latitude for schema.org GeoCoordinates. Null until an admin sets it explicitly.';
COMMENT ON COLUMN public.site_settings.contact_longitude IS
  'Clinic longitude for schema.org GeoCoordinates. Null until an admin sets it explicitly.';
COMMENT ON COLUMN public.site_settings.contact_price_range IS
  'schema.org priceRange (e.g. "$$"). Empty string omits the field from structured data.';
