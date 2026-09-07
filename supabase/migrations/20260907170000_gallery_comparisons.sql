-- Multiple before/after smile comparisons for the gallery section
-- Rollback:
--   DROP TABLE IF EXISTS public.gallery_comparisons;

CREATE TABLE IF NOT EXISTS public.gallery_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  before_image_url text NOT NULL DEFAULT '',
  after_image_url text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gallery_comparisons_sort_idx
  ON public.gallery_comparisons (sort_order)
  WHERE is_published = true;

ALTER TABLE public.gallery_comparisons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read gallery_comparisons" ON public.gallery_comparisons;
CREATE POLICY "Public read gallery_comparisons"
  ON public.gallery_comparisons FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Admin write gallery_comparisons" ON public.gallery_comparisons;
CREATE POLICY "Admin write gallery_comparisons"
  ON public.gallery_comparisons FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Seed from existing showcase rows when empty
INSERT INTO public.gallery_comparisons (
  before_image_url,
  after_image_url,
  alt_text,
  sort_order,
  is_published
)
SELECT
  COALESCE(NULLIF(image_url, ''), '/dental/771453934_18084846845253727_4216909913248468130_n.jpg'),
  COALESCE(NULLIF(image_url, ''), '/dental/771453934_18084846845253727_4216909913248468130_n.jpg'),
  COALESCE(NULLIF(alt_text, ''), 'Before and after smile result'),
  0,
  true
FROM public.gallery_showcase
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_comparisons LIMIT 1)
LIMIT 1;

INSERT INTO public.gallery_comparisons (
  before_image_url,
  after_image_url,
  alt_text,
  sort_order,
  is_published
)
SELECT
  '/dental/774361792_18086030342253727_5992595618828369379_n.jpg',
  '/dental/771453934_18084846845253727_4216909913248468130_n.jpg',
  'Before and after smile whitening result',
  0,
  true
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_comparisons LIMIT 1);
