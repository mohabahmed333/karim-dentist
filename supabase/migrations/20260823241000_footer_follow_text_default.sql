-- Match reference footer: Follow Us as text by default (icons optional in CMS)
UPDATE public.footer_links
SET display_mode = 'text'
WHERE deleted_at IS NULL
  AND column_key = 'follow';
