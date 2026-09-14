-- When a doctor has no price override for a service, the price quoted for
-- THEM specifically should be the clinic's minimum, not the whole clinic
-- range — "EGP 300-600" isn't a real answer to "how much does Dr. X
-- charge", but "EGP 300" (the floor of that range) is. Only applies to a
-- doctor-specific quote; the clinic-wide, no-doctor-picked-yet price
-- (services.price_label itself) is untouched and still shows the full
-- range.
--
-- Same function signature/return columns as before, so no DROP needed —
-- CREATE OR REPLACE is enough to swap just the fallback logic.
--
-- Rollback: re-apply the COALESCE from 20260915070000_service_doctor_pricing.sql
-- (doctor's own price_label, else the plain services.price_label).

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
        (SELECT 'EGP ' || s.price_min_egp::text FROM public.services s
         WHERE s.id = p_service_id AND s.price_min_egp IS NOT NULL),
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
