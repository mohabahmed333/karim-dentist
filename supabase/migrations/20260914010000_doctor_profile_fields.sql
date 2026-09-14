-- Doctor identity (specialty, bio, calendar color) + a per-role dashboard
-- scope so a doctor role can be set to see only their own reservations.
-- Rollback:
--   UPDATE public.roles SET dashboard_scope = 'clinic';
--   ALTER TABLE public.roles DROP COLUMN IF EXISTS dashboard_scope;
--   ALTER TABLE public.profiles
--     DROP COLUMN IF EXISTS specialty,
--     DROP COLUMN IF EXISTS bio,
--     DROP COLUMN IF EXISTS calendar_color;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS calendar_color text;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_calendar_color_format;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_calendar_color_format
  CHECK (calendar_color IS NULL OR calendar_color ~ '^#[0-9a-fA-F]{6}$');

-- Whether a role's dashboard shows the whole clinic (default) or only the
-- signed-in user's own reservations/patients. Only meaningful alongside
-- is_doctor, but kept as a plain per-role flag rather than derived from
-- is_admin_role, which means "has admin-panel write access" and is true for
-- the doctor role too.
ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS dashboard_scope text NOT NULL DEFAULT 'clinic';

ALTER TABLE public.roles
  DROP CONSTRAINT IF EXISTS roles_dashboard_scope_check;
ALTER TABLE public.roles
  ADD CONSTRAINT roles_dashboard_scope_check
  CHECK (dashboard_scope IN ('clinic', 'own'));

UPDATE public.roles SET dashboard_scope = 'own' WHERE key = 'doctor';
