-- Staff profile details (photo, phone, job title) + self-service editing.
-- Rollback:
--   DROP TRIGGER IF EXISTS profiles_guard_self_update ON public.profiles;
--   DROP FUNCTION IF EXISTS public.guard_profile_self_update();
--   DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
--   DROP POLICY IF EXISTS storage_public_read_avatars ON storage.objects;
--   DROP POLICY IF EXISTS storage_write_own_avatar ON storage.objects;
--   DELETE FROM storage.buckets WHERE id = 'avatars';
--   ALTER TABLE public.profiles
--     DROP COLUMN IF EXISTS avatar_url,
--     DROP COLUMN IF EXISTS phone,
--     DROP COLUMN IF EXISTS job_title;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS job_title text;

-- Until now the only write policy was profiles_update_admin, so a user whose
-- role is not admin-level could not save their own profile at all.
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() AND deleted_at IS NULL)
  WITH CHECK (id = auth.uid());

-- RLS is row-level, not column-level: the policy above would otherwise let a
-- user grant themselves a different role, or un-deactivate their own account.
-- Non-admins may only change their own descriptive fields.
CREATE OR REPLACE FUNCTION public.guard_profile_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.role_id IS DISTINCT FROM OLD.role_id
     OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at
  THEN
    RAISE EXCEPTION 'Only an admin can change role or account status';
  END IF;

  RETURN NEW;
END;
$$;

-- Named to sort before profiles_sync_role_from_role_id: same BEFORE timing
-- fires alphabetically, so an admin's role_id change is still synced to role.
DROP TRIGGER IF EXISTS profiles_guard_self_update ON public.profiles;
CREATE TRIGGER profiles_guard_self_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_self_update();

-- Avatars bucket: public read (same posture as the other media buckets), but a
-- user may only write inside a folder named after their own uid.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS storage_public_read_avatars ON storage.objects;
CREATE POLICY storage_public_read_avatars ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS storage_write_own_avatar ON storage.objects;
CREATE POLICY storage_write_own_avatar ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
