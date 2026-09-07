-- Homepage section order (Hero stays first in app code; not stored here).
-- Rollback:
--   ALTER TABLE public.site_settings DROP COLUMN IF EXISTS homepage_section_order;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS homepage_section_order text[] NOT NULL DEFAULT ARRAY[
    'about',
    'case-studies',
    'featured',
    'services',
    'callout',
    'experience',
    'clients'
  ]::text[];

COMMENT ON COLUMN public.site_settings.homepage_section_order IS
  'Ordered keys for homepage sections below Hero.';

UPDATE public.site_settings
SET homepage_section_order = ARRAY[
  'about',
  'case-studies',
  'featured',
  'services',
  'callout',
  'experience',
  'clients'
]::text[]
WHERE homepage_section_order IS NULL
   OR cardinality(homepage_section_order) = 0;
