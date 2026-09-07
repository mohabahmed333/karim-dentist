-- Add title, intro, text_grid section types
-- Rollback: update rows; restore prior type check.

ALTER TABLE public.case_study_sections
  DROP CONSTRAINT IF EXISTS case_study_sections_type_check;

ALTER TABLE public.case_study_sections
  ADD CONSTRAINT case_study_sections_type_check
  CHECK (type IN (
    'text',
    'media',
    'split',
    'grid',
    'columns',
    'title',
    'intro',
    'text_grid'
  ));
