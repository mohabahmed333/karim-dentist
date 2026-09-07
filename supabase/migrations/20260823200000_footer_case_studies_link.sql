-- Point portfolio footer "Projects" / case-study hash links at the index page.
UPDATE public.footer_links
SET
  label = 'Case studies',
  href = '/case-studies'
WHERE deleted_at IS NULL
  AND (
    label = 'Projects'
    OR label = 'Case studies'
    OR href = '#case-studies'
  );
