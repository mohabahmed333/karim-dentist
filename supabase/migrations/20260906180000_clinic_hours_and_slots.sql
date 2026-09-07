-- Clinic hours config + bookable appointment slots (single clinic schedule)
-- Rollback:
--   DROP TABLE IF EXISTS public.appointment_slots;
--   DROP TABLE IF EXISTS public.clinic_hours;

CREATE TABLE IF NOT EXISTS public.clinic_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ISO weekday: 0=Sun … 6=Sat; open days only
  open_weekdays int[] NOT NULL DEFAULT '{0,1,2,3,4}',
  -- Windows as "HH:MM-HH:MM" e.g. 10:00-13:00
  time_windows text[] NOT NULL DEFAULT '{"10:00-13:00","14:00-18:00"}',
  slot_minutes int NOT NULL DEFAULT 60
    CHECK (slot_minutes IN (15, 30, 45, 60, 90, 120)),
  horizon_days int NOT NULL DEFAULT 21
    CHECK (horizon_days >= 7 AND horizon_days <= 60),
  timezone text NOT NULL DEFAULT 'Africa/Cairo',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Singleton row
INSERT INTO public.clinic_hours (id)
SELECT '00000000-0000-4000-8000-000000000001'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.clinic_hours);

CREATE TABLE IF NOT EXISTS public.appointment_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'booked', 'cancelled')),
  reservation_id uuid REFERENCES public.reservations (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS appointment_slots_starts_at_unique
  ON public.appointment_slots (starts_at)
  WHERE status <> 'cancelled';

CREATE INDEX IF NOT EXISTS appointment_slots_open_starts_idx
  ON public.appointment_slots (starts_at)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS appointment_slots_reservation_idx
  ON public.appointment_slots (reservation_id)
  WHERE reservation_id IS NOT NULL;

ALTER TABLE public.clinic_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS clinic_hours_admin_all ON public.clinic_hours;
CREATE POLICY clinic_hours_admin_all
  ON public.clinic_hours
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS clinic_hours_public_read ON public.clinic_hours;
CREATE POLICY clinic_hours_public_read
  ON public.clinic_hours
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS appointment_slots_admin_all ON public.appointment_slots;
CREATE POLICY appointment_slots_admin_all
  ON public.appointment_slots
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS appointment_slots_public_read_open ON public.appointment_slots;
CREATE POLICY appointment_slots_public_read_open
  ON public.appointment_slots
  FOR SELECT TO anon, authenticated
  USING (status = 'open');
