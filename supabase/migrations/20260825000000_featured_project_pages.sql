-- Featured project slugs + modular page sections (mirrors case studies)
-- Rollback: DROP TABLE public.featured_project_sections; ALTER TABLE public.featured_projects DROP COLUMN slug;

ALTER TABLE public.featured_projects
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.featured_projects
SET slug = lower(
  regexp_replace(
    regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  )
)
WHERE slug IS NULL OR slug = '';

UPDATE public.featured_projects
SET slug = 'featured-' || substr(id::text, 1, 8)
WHERE deleted_at IS NULL
  AND (slug IS NULL OR slug = '');

WITH ranked AS (
  SELECT
    id,
    slug,
    ROW_NUMBER() OVER (
      PARTITION BY slug
      ORDER BY sort_order, created_at, id
    ) AS rn
  FROM public.featured_projects
  WHERE deleted_at IS NULL AND slug IS NOT NULL
)
UPDATE public.featured_projects fp
SET slug = fp.slug || '-' || substr(fp.id::text, 1, 8)
FROM ranked r
WHERE fp.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS featured_projects_slug_unique_idx
  ON public.featured_projects (slug)
  WHERE deleted_at IS NULL AND slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.featured_project_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  featured_project_id uuid NOT NULL REFERENCES public.featured_projects (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'text',
    'media',
    'split',
    'grid',
    'columns',
    'title',
    'intro',
    'text_grid'
  )),
  layout_variant text NOT NULL DEFAULT 'default',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS featured_project_sections_project_sort_idx
  ON public.featured_project_sections (featured_project_id, sort_order)
  WHERE deleted_at IS NULL;

ALTER TABLE public.featured_project_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS featured_project_sections_public_read ON public.featured_project_sections;
CREATE POLICY featured_project_sections_public_read ON public.featured_project_sections
  FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND is_visible = true
    AND EXISTS (
      SELECT 1
      FROM public.featured_projects fp
      WHERE fp.id = featured_project_id
        AND fp.deleted_at IS NULL
        AND fp.is_published = true
    )
  );

DROP POLICY IF EXISTS featured_project_sections_admin_all ON public.featured_project_sections;
CREATE POLICY featured_project_sections_admin_all ON public.featured_project_sections
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
