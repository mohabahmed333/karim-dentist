-- Stage 2 of multi-doctor: which doctors can perform which service, plus a
-- consumer-facing price label services can carry (so the WhatsApp assistant
-- can answer "how much?" for services that have one on file).
--
-- service_doctors is the single source of truth for "who's eligible for
-- this service" — a service with zero rows in it means "any bookable
-- doctor can do it", so the ~170 pre-existing services stay bookable with
-- every doctor without needing to be backfilled one by one.
--
-- Rollback:
--   ALTER TABLE public.services DROP COLUMN IF EXISTS price_label;
--   DROP FUNCTION IF EXISTS public.list_bookable_doctors_for_service(uuid, timestamptz);
--   DROP TABLE IF EXISTS public.service_doctors;

CREATE TABLE IF NOT EXISTS public.service_doctors (
  service_id uuid NOT NULL REFERENCES public.services (id) ON DELETE CASCADE,
  doctor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (service_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS service_doctors_doctor_idx
  ON public.service_doctors (doctor_id);

ALTER TABLE public.service_doctors ENABLE ROW LEVEL SECURITY;

-- Admin-only RLS, mirroring role_permissions. No public SELECT policy —
-- patient-facing surfaces read exclusively through the function below,
-- which projects only safe profile columns; profiles itself has no public
-- read policy today and this must not become a back door around that.
DROP POLICY IF EXISTS service_doctors_admin_all ON public.service_doctors;
CREATE POLICY service_doctors_admin_all ON public.service_doctors
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- The one place "which doctors, and when are they next free" is computed —
-- used by the public booking form, the WhatsApp assistant, and the admin
-- "open to all / restricted to N" badge. p_service_id NULL, or a service
-- with zero service_doctors rows, both mean "every bookable doctor".
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
  next_slot_starts_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    p.id, p.display_name, p.specialty, p.bio, p.avatar_url, p.calendar_color,
    ns.id, ns.starts_at
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

-- ---------------------------------------------------------------------------
-- Service pricing — free text, not a strict number: "From EGP 800" and
-- "EGP 300-600" are both real answers a clinic gives, not one fixed figure.
-- ---------------------------------------------------------------------------

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS price_label text;
