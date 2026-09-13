-- Map every existing admin profile onto the new "Owner" role so current
-- logins keep full access with zero behavior change.
-- Rollback:
--   UPDATE public.profiles SET role_id = NULL WHERE role_id = (SELECT id FROM public.roles WHERE key = 'owner');

UPDATE public.profiles p
SET role_id = (SELECT id FROM public.roles WHERE key = 'owner')
WHERE p.role = 'admin'
  AND p.role_id IS NULL;
