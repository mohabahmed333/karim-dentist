-- Case studies index page intro (editable in customize)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS case_studies_title text NOT NULL DEFAULT 'Case Studies',
  ADD COLUMN IF NOT EXISTS case_studies_description text NOT NULL DEFAULT
    'Once upon a time, in a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil.';

UPDATE public.site_settings
SET
  case_studies_title = COALESCE(NULLIF(case_studies_title, ''), 'Case Studies'),
  case_studies_description = COALESCE(
    NULLIF(case_studies_description, ''),
    'Once upon a time, in a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil.'
  );
