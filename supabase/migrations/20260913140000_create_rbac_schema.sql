-- Fine-grained roles & permissions, layered alongside the existing coarse
-- admin/viewer profiles.role + is_admin() RLS gate (left untouched).
-- Rollback:
--   DROP TRIGGER IF EXISTS profiles_sync_role_from_role_id ON public.profiles;
--   DROP FUNCTION IF EXISTS public.sync_profile_role_from_role_id();
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS role_id;
--   DROP TABLE IF EXISTS public.role_permissions;
--   DROP TABLE IF EXISTS public.permissions;
--   DROP TABLE IF EXISTS public.roles;

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_admin_role boolean NOT NULL DEFAULT true,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  category text NOT NULL,
  label text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles (id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES public.permissions (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS role_permissions_permission_idx
  ON public.role_permissions (permission_id);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.roles (id);

CREATE INDEX IF NOT EXISTS profiles_role_id_idx ON public.profiles (role_id);

-- Keep the legacy profiles.role text column (and therefore is_admin() and
-- every RLS policy that calls it) in sync with the fine-grained role's
-- is_admin_role flag, so the app can manage role_id going forward without a
-- rewrite of every existing policy.
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_role_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  admin_flag boolean;
BEGIN
  IF NEW.role_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_admin_role INTO admin_flag
  FROM public.roles
  WHERE id = NEW.role_id;

  NEW.role := CASE WHEN admin_flag THEN 'admin' ELSE 'viewer' END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_role_from_role_id ON public.profiles;
CREATE TRIGGER profiles_sync_role_from_role_id
  BEFORE INSERT OR UPDATE OF role_id ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_from_role_id();

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_admin_all ON public.roles;
CREATE POLICY roles_admin_all ON public.roles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS permissions_admin_all ON public.permissions;
CREATE POLICY permissions_admin_all ON public.permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS role_permissions_admin_all ON public.role_permissions;
CREATE POLICY role_permissions_admin_all ON public.role_permissions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
