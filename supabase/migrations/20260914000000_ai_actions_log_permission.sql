-- Permission for the new /admin/ai-actions log page (read-only history of
-- AI-proposed actions and their outcomes).
-- Rollback:
--   DELETE FROM public.role_permissions WHERE permission_id IN
--     (SELECT id FROM public.permissions WHERE key = 'ai-actions.view');
--   DELETE FROM public.permissions WHERE key = 'ai-actions.view';

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('ai-actions.view', 'ai-actions', 'View AI actions log', 112)
ON CONFLICT (key) DO UPDATE
SET category = EXCLUDED.category,
    label = EXCLUDED.label,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key = 'ai-actions.view'
ON CONFLICT DO NOTHING;
