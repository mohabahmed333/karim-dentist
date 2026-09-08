-- Admin home dashboard widget layout (clinic-wide).
-- Rollback:
--   ALTER TABLE public.site_settings DROP COLUMN IF EXISTS dashboard_layout;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS dashboard_layout jsonb NOT NULL DEFAULT '[
    {"id":"attention","colSpan":12},
    {"id":"kpis","colSpan":12},
    {"id":"daySchedule","colSpan":12},
    {"id":"bookings","colSpan":3},
    {"id":"recent","colSpan":3},
    {"id":"schedule","colSpan":3},
    {"id":"messages","colSpan":3},
    {"id":"charts","colSpan":12}
  ]'::jsonb;

COMMENT ON COLUMN public.site_settings.dashboard_layout IS
  'Ordered admin home widgets: [{id, colSpan}] on a 12-column grid.';

UPDATE public.site_settings
SET dashboard_layout = '[
  {"id":"attention","colSpan":12},
  {"id":"kpis","colSpan":12},
  {"id":"daySchedule","colSpan":12},
  {"id":"bookings","colSpan":3},
  {"id":"recent","colSpan":3},
  {"id":"schedule","colSpan":3},
  {"id":"messages","colSpan":3},
  {"id":"charts","colSpan":12}
]'::jsonb
WHERE dashboard_layout IS NULL
   OR dashboard_layout = 'null'::jsonb
   OR dashboard_layout = '[]'::jsonb;
