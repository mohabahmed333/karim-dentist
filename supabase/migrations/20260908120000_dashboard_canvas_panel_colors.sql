-- Dashboard canvas + panel theme colors on site_settings
-- Rollback:
--   ALTER TABLE public.site_settings
--     DROP COLUMN IF EXISTS dashboard_canvas_color,
--     DROP COLUMN IF EXISTS dashboard_panel_color;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS dashboard_canvas_color text NOT NULL DEFAULT '#F7F8F8'
    CHECK (dashboard_canvas_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD COLUMN IF NOT EXISTS dashboard_panel_color text NOT NULL DEFAULT '#FFFFFF'
    CHECK (dashboard_panel_color ~ '^#[0-9A-Fa-f]{6}$');

COMMENT ON COLUMN public.site_settings.dashboard_canvas_color IS
  'Admin dashboard page/canvas background (hex #RRGGBB)';
COMMENT ON COLUMN public.site_settings.dashboard_panel_color IS
  'Admin dashboard content panel / card surface (hex #RRGGBB)';
