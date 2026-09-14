-- Inventory & Consumables, part 2: per-service consumption recipes — what a
-- completed appointment for a service deducts from inventory.
--
-- Mirrors service_doctors' composite-PK, no-id shape
-- (20260915030000_service_doctors_and_pricing.sql) — but unlike
-- service_doctors, zero rows here means "this service consumes nothing
-- tracked", NOT "any item applies". There is no sensible wildcard reading
-- for "which items does a routine cleaning use", so this table's empty-set
-- semantics deliberately do not follow the service_doctors precedent it
-- otherwise copies.
--
-- kind = 'fixed'    -> completion silently deducts default_qty, no staff
--                      input (an implant kit: fixture + drill + suture).
-- kind = 'variable' -> the completion UI must collect an actual qty_used
--                      per row (default_qty is only the pre-filled
--                      suggestion) before the appointment can be marked
--                      done. Enforced server-side in
--                      src/services/inventory/mutations.ts, not just in a
--                      modal — see completeTreatment/completeReservation.
--
-- Rollback:
--   DELETE FROM public.permissions WHERE key = 'inventory.recipes.manage';
--   DROP TRIGGER IF EXISTS service_recipes_log_action ON public.service_recipes;
--   DROP TABLE IF EXISTS public.service_recipes;

CREATE TABLE IF NOT EXISTS public.service_recipes (
  service_id   uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  -- RESTRICT, not CASCADE: an item still wired into a recipe should not be
  -- silently hard-deletable. Soft-delete via inventory_items.deleted_at
  -- still works and doesn't hit this FK.
  item_id      uuid NOT NULL REFERENCES public.inventory_items (id) ON DELETE RESTRICT,
  kind         text NOT NULL DEFAULT 'fixed' CHECK (kind IN ('fixed', 'variable')),
  default_qty  numeric NOT NULL CHECK (default_qty > 0),
  is_required  boolean NOT NULL DEFAULT true,
  notes        text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (service_id, item_id)
);

CREATE INDEX IF NOT EXISTS service_recipes_item_idx
  ON public.service_recipes (item_id);

ALTER TABLE public.service_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_recipes_admin_all ON public.service_recipes;
CREATE POLICY service_recipes_admin_all ON public.service_recipes
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS service_recipes_log_action ON public.service_recipes;
CREATE TRIGGER service_recipes_log_action
  AFTER INSERT OR UPDATE OR DELETE ON public.service_recipes
  FOR EACH ROW EXECUTE FUNCTION public.log_system_action('service_id,item_id');
