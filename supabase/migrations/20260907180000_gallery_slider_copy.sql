-- Align gallery/slider section copy with before/after redesign.
-- Only updates rows still using the previous default English strings.

UPDATE public.site_settings
SET
  gallery_heading = 'Smile results',
  gallery_heading_ar = COALESCE(NULLIF(gallery_heading_ar, ''), 'نتائج الابتسامة'),
  gallery_description = 'Drag to compare before and after.',
  gallery_description_ar = COALESCE(NULLIF(gallery_description_ar, ''), 'اسحب للمقارنة بين قبل وبعد.'),
  slider_heading = 'Clinic moments',
  slider_heading_ar = COALESCE(NULLIF(slider_heading_ar, ''), 'لحظات من العيادة'),
  featured_description = 'A closer look at the space and care.',
  featured_description_ar = COALESCE(NULLIF(featured_description_ar, ''), 'نظرة أقرب على المكان والرعاية.'),
  updated_at = now()
WHERE gallery_heading = 'Clinic highlights & smile results'
   OR gallery_description LIKE 'Explore treatment imagery%'
   OR slider_heading = 'More clinic & treatment highlights'
   OR featured_description LIKE 'Browse more visuals from the clinic%';
