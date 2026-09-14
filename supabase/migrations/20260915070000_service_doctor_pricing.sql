-- Per-(service, doctor) price override. services.price_label stays the
-- clinic-wide default; a doctor can now charge a different amount for the
-- same service, and list_bookable_doctors_for_service resolves which one
-- applies in one place, same as it already does for eligibility.
--
-- Rollback:
--   CREATE OR REPLACE FUNCTION public.list_bookable_doctors_for_service(
--     p_service_id uuid DEFAULT NULL, p_from timestamptz DEFAULT now()
--   ) RETURNS TABLE (
--     id uuid, display_name text, specialty text, bio text, avatar_url text,
--     calendar_color text, next_slot_id uuid, next_slot_starts_at timestamptz
--   ) LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
--     SELECT p.id, p.display_name, p.specialty, p.bio, p.avatar_url, p.calendar_color, ns.id, ns.starts_at
--     FROM public.profiles p
--     JOIN public.doctor_hours dh ON dh.doctor_id = p.id AND dh.is_bookable = true
--     JOIN public.roles r ON r.id = p.role_id AND r.is_doctor = true
--     LEFT JOIN LATERAL (
--       SELECT s.id, s.starts_at FROM public.appointment_slots s
--       WHERE s.doctor_id = p.id AND s.status = 'open' AND s.starts_at >= p_from
--       ORDER BY s.starts_at ASC LIMIT 1
--     ) ns ON true
--     WHERE p.deleted_at IS NULL
--       AND (p_service_id IS NULL
--         OR NOT EXISTS (SELECT 1 FROM public.service_doctors sd WHERE sd.service_id = p_service_id)
--         OR EXISTS (SELECT 1 FROM public.service_doctors sd WHERE sd.service_id = p_service_id AND sd.doctor_id = p.id))
--     ORDER BY (ns.starts_at IS NULL), ns.starts_at ASC, p.display_name NULLS LAST;
--   $$;
--   ALTER TABLE public.service_doctors DROP COLUMN IF EXISTS price_label;

ALTER TABLE public.service_doctors
  ADD COLUMN IF NOT EXISTS price_label text;

-- The OUT-parameter row type is changing (a new trailing column), which
-- Postgres will not let CREATE OR REPLACE do in place.
DROP FUNCTION IF EXISTS public.list_bookable_doctors_for_service(uuid, timestamptz);

CREATE OR REPLACE FUNCTION public.list_bookable_doctors_for_service(
  p_service_id uuid DEFAULT NULL,
  p_from timestamptz DEFAULT now()
)
RETURNS TABLE (
  id uuid,
  display_name text,
  specialty text,
  bio text,
  avatar_url text,
  calendar_color text,
  next_slot_id uuid,
  next_slot_starts_at timestamptz,
  price_label text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id, p.display_name, p.specialty, p.bio, p.avatar_url, p.calendar_color,
    ns.id, ns.starts_at,
    CASE
      WHEN p_service_id IS NULL THEN NULL
      ELSE COALESCE(
        (SELECT sd.price_label FROM public.service_doctors sd
         WHERE sd.service_id = p_service_id AND sd.doctor_id = p.id),
        (SELECT s.price_label FROM public.services s WHERE s.id = p_service_id)
      )
    END
  FROM public.profiles p
  JOIN public.doctor_hours dh ON dh.doctor_id = p.id AND dh.is_bookable = true
  JOIN public.roles r ON r.id = p.role_id AND r.is_doctor = true
  LEFT JOIN LATERAL (
    SELECT s.id, s.starts_at
    FROM public.appointment_slots s
    WHERE s.doctor_id = p.id
      AND s.status = 'open'
      AND s.starts_at >= p_from
    ORDER BY s.starts_at ASC
    LIMIT 1
  ) ns ON true
  WHERE p.deleted_at IS NULL
    AND (
      p_service_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM public.service_doctors sd WHERE sd.service_id = p_service_id
      )
      OR EXISTS (
        SELECT 1 FROM public.service_doctors sd
        WHERE sd.service_id = p_service_id AND sd.doctor_id = p.id
      )
    )
  ORDER BY (ns.starts_at IS NULL), ns.starts_at ASC, p.display_name NULLS LAST;
$$;

REVOKE ALL ON FUNCTION public.list_bookable_doctors_for_service(uuid, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_bookable_doctors_for_service(uuid, timestamptz)
  TO anon, authenticated;
