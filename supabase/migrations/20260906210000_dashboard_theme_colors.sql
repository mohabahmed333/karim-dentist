-- Dashboard theme colors on site_settings
-- Rollback: ALTER TABLE public.site_settings DROP COLUMN IF EXISTS dashboard_primary_color, DROP COLUMN IF EXISTS dashboard_secondary_color;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS dashboard_primary_color text NOT NULL DEFAULT '#5E6AD2'
    CHECK (dashboard_primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD COLUMN IF NOT EXISTS dashboard_secondary_color text NOT NULL DEFAULT '#3B82F6'
    CHECK (dashboard_secondary_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN public.site_settings.dashboard_primary_color IS
  'Admin dashboard primary accent (hex #RRGGBB)';
COMMENT ON COLUMN public.site_settings.dashboard_secondary_color IS
  'Admin dashboard secondary accent (hex #RRGGBB)';
