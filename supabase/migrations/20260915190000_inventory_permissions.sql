-- Inventory & Consumables, part 5: the remaining permission keys —
-- recipe editing, and the two new "complete this visit" gates.
--
-- patient_treatments.complete / reservations.complete are new because
-- completion now has an irreversible side effect (stock leaves the
-- building via src/services/inventory/mutations.ts's completeTreatment/
-- completeReservation), so it deserves its own gate distinct from general
-- edit rights (patients.treatments.edit / reservations.edit). The app-layer
-- schemas for the generic updateReservation/updateTreatment mutations stop
-- accepting a completion status directly once these actions exist — see
-- src/services/reservations/schemas.ts and src/services/patient_treatments/schemas.ts.
--
-- Rollback:
--   DELETE FROM public.permissions WHERE key IN ('inventory.recipes.manage', 'patient_treatments.complete', 'reservations.complete');

INSERT INTO public.permissions (key, category, label, sort_order) VALUES
  ('inventory.recipes.manage', 'inventory', 'Edit service consumption recipes', 313),
  ('reservations.complete', 'reservations', 'Mark a reservation complete (deducts inventory)', 26),
  ('patient_treatments.complete', 'patients', 'Mark a treatment complete (deducts inventory)', 47)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'owner'
  AND p.key IN ('inventory.recipes.manage', 'reservations.complete', 'patient_treatments.complete')
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'front-desk'
  AND p.key = 'reservations.complete'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM public.roles r CROSS JOIN public.permissions p
WHERE r.key = 'doctor'
  AND p.key IN ('reservations.complete', 'patient_treatments.complete')
ON CONFLICT DO NOTHING;
