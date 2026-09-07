-- Restore the second remapped portfolio link (was Services) so footer isn't duplicated.
UPDATE public.footer_links
SET
  label = 'Services',
  href = '#featured'
WHERE deleted_at IS NULL
  AND column_key = 'portfolio'
  AND label = 'Case studies'
  AND href = '/case-studies'
  AND sort_order = 3;
