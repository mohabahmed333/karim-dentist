-- Featured projects index page intro (editable in customize)
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS featured_title text NOT NULL DEFAULT 'Featured Projects',
  ADD COLUMN IF NOT EXISTS featured_description text NOT NULL DEFAULT
    'Once upon a time, in a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil.';

UPDATE public.site_settings
SET
  featured_title = COALESCE(NULLIF(featured_title, ''), 'Featured Projects'),
  featured_description = COALESCE(
    NULLIF(featured_description, ''),
    'Once upon a time, in a vibrant city of ancient wonder and modern ambition, there lived a graphic designer named Galil.'
  );

-- Point footer Services (featured hash) at the featured index page
UPDATE public.footer_links
SET
  label = 'Featured projects',
  href = '/featured'
WHERE deleted_at IS NULL
  AND column_key = 'portfolio'
  AND (
    label = 'Services'
    OR href = '#featured'
  );
