-- Bilingual copy for case studies, featured projects, and builder text (JSON keys).
-- Rollback: DROP COLUMN title_ar, description_ar / eyebrow_ar from tables below.

ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_ar text NOT NULL DEFAULT '';

ALTER TABLE public.featured_projects
  ADD COLUMN IF NOT EXISTS title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS eyebrow_ar text NOT NULL DEFAULT '';
