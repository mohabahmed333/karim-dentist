-- Reservations for clinic staff dashboard
-- Rollback: DROP TABLE IF EXISTS public.reservations;

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  phone text NOT NULL,
  email text,
  service_id uuid REFERENCES public.services (id) ON DELETE SET NULL,
  service_label text NOT NULL,
  starts_at timestamptz NOT NULL,
  notes text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS reservations_starts_at_idx
  ON public.reservations (starts_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS reservations_status_idx
  ON public.reservations (status)
  WHERE deleted_at IS NULL;

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS reservations_admin_all ON public.reservations;
CREATE POLICY reservations_admin_all ON public.reservations
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.reservations (
  patient_name,
  phone,
  email,
  service_label,
  starts_at,
  notes,
  status
)
SELECT * FROM (VALUES
  (
    'Ahmed Hassan',
    '+20 100 123 4567',
    'ahmed@example.com',
    'General consultation',
    date_trunc('day', now()) + interval '10 hours',
    'First visit',
    'pending'
  ),
  (
    'Sara Mohamed',
    '+20 101 234 5678',
    'sara@example.com',
    'Teeth whitening',
    date_trunc('day', now()) + interval '11 hours 30 minutes',
    '',
    'confirmed'
  ),
  (
    'Omar Ali',
    '+20 102 345 6789',
    NULL,
    'Dental implants',
    date_trunc('day', now()) + interval '1 day' + interval '13 hours',
    'Follow-up',
    'pending'
  ),
  (
    'Layla Ibrahim',
    '+20 103 456 7890',
    'layla@example.com',
    'General consultation',
    date_trunc('day', now()) + interval '2 days' + interval '15 hours',
    '',
    'confirmed'
  ),
  (
    'Youssef Nabil',
    '+20 104 567 8901',
    NULL,
    'Orthodontics',
    date_trunc('day', now()) - interval '1 day' + interval '17 hours 30 minutes',
    '',
    'completed'
  ),
  (
    'Nour Farid',
    '+20 105 678 9012',
    'nour@example.com',
    'Teeth whitening',
    date_trunc('day', now()) - interval '2 days' + interval '10 hours',
    '',
    'cancelled'
  ),
  (
    'Karim Saleh',
    '+20 106 789 0123',
    NULL,
    'General consultation',
    date_trunc('day', now()) + interval '3 days' + interval '10 hours',
    '',
    'pending'
  ),
  (
    'Mariam Adel',
    '+20 107 890 1234',
    'mariam@example.com',
    'Dental implants',
    date_trunc('day', now()) + interval '4 days' + interval '11 hours 30 minutes',
    'Needs X-ray',
    'confirmed'
  )
) AS seed(
  patient_name,
  phone,
  email,
  service_label,
  starts_at,
  notes,
  status
)
WHERE NOT EXISTS (
  SELECT 1 FROM public.reservations WHERE deleted_at IS NULL LIMIT 1
);
