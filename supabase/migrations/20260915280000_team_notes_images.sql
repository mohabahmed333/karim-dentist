-- Storage bucket for images pasted into a team note (admin_notes.content is
-- now rich HTML, not plain text — see the RichTextEditor + Image extension
-- wiring in src/features/admin/components/patients/RichTextEditor.tsx).
-- Same admin-write/public-read shape as patient-records.
-- Rollback:
--   DROP POLICY IF EXISTS storage_admin_write_team_notes ON storage.objects;
--   DROP POLICY IF EXISTS storage_public_read_team_notes ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'team-notes';

INSERT INTO storage.buckets (id, name, public)
VALUES ('team-notes', 'team-notes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_public_read_team_notes ON storage.objects;
CREATE POLICY storage_public_read_team_notes ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'team-notes');

DROP POLICY IF EXISTS storage_admin_write_team_notes ON storage.objects;
CREATE POLICY storage_admin_write_team_notes ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'team-notes' AND public.is_admin())
  WITH CHECK (bucket_id = 'team-notes' AND public.is_admin());
