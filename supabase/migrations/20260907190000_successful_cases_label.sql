-- Rename Gallery section to Successful Cases (default copy only).

UPDATE public.site_settings
SET
  gallery_title = 'Successful Cases',
  gallery_title_ar = COALESCE(NULLIF(gallery_title_ar, ''), 'حالات ناجحة'),
  updated_at = now()
WHERE gallery_title = 'Gallery';

UPDATE public.footer_links
SET
  label = 'Successful Cases',
  label_ar = COALESCE(NULLIF(label_ar, ''), 'حالات ناجحة'),
  updated_at = now()
WHERE href IN ('#gallery', '/#gallery')
  AND label = 'Gallery';
