-- Add flexible 3-column row section type
-- Rollback: update rows with type=columns; alter constraint back to 4 types.

ALTER TABLE public.case_study_sections
  DROP CONSTRAINT IF EXISTS case_study_sections_type_check;

ALTER TABLE public.case_study_sections
  ADD CONSTRAINT case_study_sections_type_check
  CHECK (type IN ('text', 'media', 'split', 'grid', 'columns'));
