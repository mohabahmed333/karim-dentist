-- My Day gets a permission of its own.
--
-- It had been gated on `patients.view`, which front-desk holds because they
-- need the patient directory — so the chairside cockpit appeared in reception's
-- nav, showing a doctor's day to someone who does not have one. Splitting the
-- key lets the directory and the cockpit be granted separately.
--
-- Granted to `owner` (who supervises the clinic and picks whose day to view)
-- and to every role flagged `is_doctor`. Deliberately NOT to front-desk.
--
-- Rollback:
--   DELETE FROM public.role_permissions WHERE permission_id IN
--     (SELECT id FROM public.permissions WHERE key = 'my-day.view');
--   DELETE FROM public.permissions WHERE key = 'my-day.view';

INSERT INTO public.permissions (key, category, label, description, sort_order) VALUES
  (
    'my-day.view',
    'patients',
    'View My Day',
    'The chairside cockpit for today''s appointments.',
    39
  )
ON CONFLICT (key) DO UPDATE
SET category = EXCLUDED.category,
    label = EXCLUDED.label,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE p.key = 'my-day.view'
  AND r.deleted_at IS NULL
  AND (r.key = 'owner' OR r.is_doctor = true)
ON CONFLICT DO NOTHING;
