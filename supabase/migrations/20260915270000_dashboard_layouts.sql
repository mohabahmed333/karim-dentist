-- Per-page saved widget layouts for the generic customizable-dashboard
-- framework (see docs/superpowers/specs/2026-09-15-dashboard-widget-framework...).
-- Overview keeps its own storage (site_settings.dashboard_layout, unchanged);
-- every other page (starting with Inventory Analytics) gets one row here,
-- keyed by page_key, so adding a future page never needs another migration.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.dashboard_layouts;

CREATE TABLE IF NOT EXISTS public.dashboard_layouts (
  page_key   text PRIMARY KEY,
  layout     jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dashboard_layouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dashboard_layouts_admin_all ON public.dashboard_layouts;
CREATE POLICY dashboard_layouts_admin_all
  ON public.dashboard_layouts
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
