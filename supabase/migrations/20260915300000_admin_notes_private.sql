-- Team notes were visible to every admin/doctor (a shared corkboard); staff
-- found that surprising — one person's note showing up under another
-- account felt like a leak, not a feature. Scope them to their author instead:
-- each admin only ever sees and edits their own notes.
-- Rollback:
--   DROP POLICY IF EXISTS admin_notes_owner_all ON public.admin_notes;
--   CREATE POLICY admin_notes_admin_all ON public.admin_notes
--     FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_notes_admin_all ON public.admin_notes;

CREATE POLICY admin_notes_owner_all ON public.admin_notes
  FOR ALL TO authenticated
  USING (public.is_admin() AND created_by = auth.uid())
  WITH CHECK (public.is_admin() AND created_by = auth.uid());
