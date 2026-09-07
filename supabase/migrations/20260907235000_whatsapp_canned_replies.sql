-- Canned replies for Front desk slash commands
CREATE TABLE IF NOT EXISTS public.whatsapp_canned_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slash_key text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_canned_replies_active_sort_idx
  ON public.whatsapp_canned_replies (active, sort_order);

ALTER TABLE public.whatsapp_canned_replies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_canned_replies_admin_all
  ON public.whatsapp_canned_replies;
CREATE POLICY whatsapp_canned_replies_admin_all
  ON public.whatsapp_canned_replies
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO public.whatsapp_canned_replies (slash_key, title, body, sort_order)
VALUES
  (
    'hello',
    'Greeting',
    'Hello! Thank you for contacting The Dental Lounge. How can we help you today?',
    10
  ),
  (
    'thanks',
    'Thanks',
    'Thank you for reaching out. We appreciate your message and will get back to you shortly.',
    20
  ),
  (
    'hours',
    'Clinic hours',
    'Our clinic hours are Sunday–Thursday, 10:00–20:00. Fridays are by appointment only.',
    30
  ),
  (
    'directions',
    'Directions',
    'We are at A 41 Ozone Medical Center, New Cairo, Al Narges Buildings. Reply /location and we can send the map pin.',
    40
  ),
  (
    'booking',
    'Book appointment',
    'We would be happy to book an appointment for you. Please share your preferred day and time, and our front desk will confirm.',
    50
  ),
  (
    'wait',
    'One moment',
    'One moment please — I am checking with the doctor and will reply shortly.',
    60
  )
ON CONFLICT (slash_key) DO NOTHING;
