-- Shared "team notice board" — draggable floating sticky notes, visible to
-- every admin/doctor, distinct from the per-patient clinical note. Free text
-- only, no category/stamps. Dismissing soft-deletes (dismissed_at) so it
-- just disappears from the active board rather than a hard delete.
-- Rollback: DROP TABLE public.admin_notes;

CREATE TABLE public.admin_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  color text NOT NULL DEFAULT 'yellow',
  created_by uuid REFERENCES public.profiles (id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  dismissed_at timestamptz
);

CREATE INDEX admin_notes_active_idx ON public.admin_notes (created_at)
  WHERE dismissed_at IS NULL;

ALTER TABLE public.admin_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_notes_admin_all ON public.admin_notes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Permission: usable by every existing staff role, same pattern as
-- 20260915190000_inventory_permissions.sql.
-- Rollback: DELETE FROM public.permissions WHERE key = 'notes.manage';

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('notes.manage', 'general', 'Post and dismiss team notes', 900)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key IN ('owner', 'front-desk', 'doctor')
  AND p.key = 'notes.manage'
ON CONFLICT DO NOTHING;
