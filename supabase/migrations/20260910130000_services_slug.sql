-- Service detail page slugs (/services/[slug]).
-- Rollback: DROP INDEX public.services_slug_unique_idx; ALTER TABLE public.services DROP COLUMN slug;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.services
SET slug = lower(
  regexp_replace(
    regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  )
)
WHERE slug IS NULL OR slug = '';

UPDATE public.services
SET slug = 'service-' || substr(id::text, 1, 8)
WHERE deleted_at IS NULL
  AND (slug IS NULL OR slug = '');

-- Resolve duplicate slugs (e.g. two services that stem to the same title).
WITH ranked AS (
  SELECT
    id,
    slug,
    ROW_NUMBER() OVER (
      PARTITION BY slug
      ORDER BY sort_order, created_at, id
    ) AS rn
  FROM public.services
  WHERE deleted_at IS NULL AND slug IS NOT NULL
)
UPDATE public.services s
SET slug = s.slug || '-' || substr(s.id::text, 1, 8)
FROM ranked r
WHERE s.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS services_slug_unique_idx
  ON public.services (slug)
  WHERE deleted_at IS NULL AND slug IS NOT NULL;
