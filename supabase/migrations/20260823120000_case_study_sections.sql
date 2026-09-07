-- Case study slugs + modular page sections
-- Rollback: DROP TABLE public.case_study_sections; ALTER TABLE public.case_studies DROP COLUMN slug;

ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS slug text;

UPDATE public.case_studies
SET slug = lower(
  regexp_replace(
    regexp_replace(trim(title), '[^a-zA-Z0-9]+', '-', 'g'),
    '(^-|-$)',
    '',
    'g'
  )
)
WHERE slug IS NULL OR slug = '';

UPDATE public.case_studies
SET slug = 'case-study-' || substr(id::text, 1, 8)
WHERE deleted_at IS NULL
  AND (slug IS NULL OR slug = '');

-- Resolve duplicate slugs (e.g. multiple "Untitled" drafts -> untitled)
WITH ranked AS (
  SELECT
    id,
    slug,
    ROW_NUMBER() OVER (
      PARTITION BY slug
      ORDER BY sort_order, created_at, id
    ) AS rn
  FROM public.case_studies
  WHERE deleted_at IS NULL AND slug IS NOT NULL
)
UPDATE public.case_studies cs
SET slug = cs.slug || '-' || substr(cs.id::text, 1, 8)
FROM ranked r
WHERE cs.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS case_studies_slug_unique_idx
  ON public.case_studies (slug)
  WHERE deleted_at IS NULL AND slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.case_study_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_study_id uuid NOT NULL REFERENCES public.case_studies (id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text', 'media', 'split', 'grid')),
  layout_variant text NOT NULL DEFAULT 'default',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS case_study_sections_case_sort_idx
  ON public.case_study_sections (case_study_id, sort_order)
  WHERE deleted_at IS NULL;

ALTER TABLE public.case_study_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS case_study_sections_public_read ON public.case_study_sections;
CREATE POLICY case_study_sections_public_read ON public.case_study_sections
  FOR SELECT TO anon, authenticated
  USING (
    deleted_at IS NULL
    AND is_visible = true
    AND EXISTS (
      SELECT 1
      FROM public.case_studies cs
      WHERE cs.id = case_study_id
        AND cs.deleted_at IS NULL
        AND cs.is_published = true
    )
  );

DROP POLICY IF EXISTS case_study_sections_admin_all ON public.case_study_sections;
CREATE POLICY case_study_sections_admin_all ON public.case_study_sections
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed starter sections for existing case studies without sections
INSERT INTO public.case_study_sections (case_study_id, type, layout_variant, content, sort_order)
SELECT
  cs.id,
  'text',
  'intro',
  jsonb_build_object(
    'heading', 'Introduction',
    'body', cs.description,
    'width', 'medium',
    'align', 'left'
  ),
  0
FROM public.case_studies cs
WHERE cs.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.case_study_sections s
    WHERE s.case_study_id = cs.id
      AND s.deleted_at IS NULL
  );

INSERT INTO public.case_study_sections (case_study_id, type, layout_variant, content, sort_order)
SELECT
  cs.id,
  'media',
  'full',
  jsonb_build_object(
    'media_url', cs.media_url,
    'media_type', cs.media_type,
    'alt', cs.title,
    'caption', '',
    'aspect_ratio', '16/9',
    'object_position', 'center'
  ),
  1
FROM public.case_studies cs
WHERE cs.deleted_at IS NULL
  AND cs.media_url IS NOT NULL
  AND (
    SELECT count(*)
    FROM public.case_study_sections s
    WHERE s.case_study_id = cs.id
      AND s.deleted_at IS NULL
  ) = 1;
