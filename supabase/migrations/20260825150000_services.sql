-- Services collection + page intro settings
-- Rollback:
--   ALTER TABLE public.site_settings DROP COLUMN IF EXISTS services_title;
--   ALTER TABLE public.site_settings DROP COLUMN IF EXISTS services_description;
--   DROP TABLE IF EXISTS public.services;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS services_title text NOT NULL DEFAULT 'Services',
  ADD COLUMN IF NOT EXISTS services_description text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.site_settings.services_title IS
  'Title for the Services homepage section and /services page';
COMMENT ON COLUMN public.site_settings.services_description IS
  'Intro copy under the Services ruled header';

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  description text NOT NULL DEFAULT '',
  image_url text,
  media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video')),
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS services_sort_idx
  ON public.services (sort_order)
  WHERE deleted_at IS NULL;

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS services_public_read ON public.services;
CREATE POLICY services_public_read ON public.services
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND is_published = true);

DROP POLICY IF EXISTS services_admin_all ON public.services;
CREATE POLICY services_admin_all ON public.services
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

UPDATE public.site_settings
SET
  services_title = COALESCE(NULLIF(services_title, ''), 'Services'),
  services_description = COALESCE(
    NULLIF(services_description, ''),
    'Studio capabilities across brand, campaign, and content — built for screens, stages, and everything between.'
  );

INSERT INTO public.services (
  title, tags, description, image_url, media_type, sort_order, is_published
)
SELECT * FROM (VALUES
  (
    'Brand',
    ARRAY['Look & feel', 'Core Elements', 'Brand Guidelines']::text[],
    'We create engaging brand and campaign identities that resonate with your target audience, from logo design to complete brand experience.',
    '/design/dallah-gulf.png',
    'image',
    1,
    true
  ),
  (
    'Campaign',
    ARRAY['Motion Design', 'Social Media', 'Art Direction']::text[],
    'We craft campaign ideas that cut through the noise — bold visuals, sharp messaging, and formats tuned for every channel.',
    '/design/voi.png',
    'image',
    2,
    true
  ),
  (
    'Content',
    ARRAY['Motion & Photography']::text[],
    'From stills to motion, we produce content that carries the brand voice with clarity, craft, and pace.',
    '/design/say-galil.png',
    'image',
    3,
    true
  )
) AS seed(title, tags, description, image_url, media_type, sort_order, is_published)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services WHERE deleted_at IS NULL LIMIT 1
);
