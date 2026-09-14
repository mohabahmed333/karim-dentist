-- Permissions for the new /admin/system-log page (log of every non-CMS
-- admin write, with one-click revert on everything except messaging
-- metadata).
-- Rollback:
--   DELETE FROM public.role_permissions WHERE permission_id IN
--     (SELECT id FROM public.permissions WHERE key IN ('system-log.view', 'system-log.revert'));
--   DELETE FROM public.permissions WHERE key IN ('system-log.view', 'system-log.revert');

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('system-log.view', 'system-log', 'View system action log', 113),
  ('system-log.revert', 'system-log', 'Revert a logged system action', 114)
ON CONFLICT (key) DO UPDATE
SET category = EXCLUDED.category,
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key IN ('system-log.view', 'system-log.revert')
ON CONFLICT DO NOTHING;
