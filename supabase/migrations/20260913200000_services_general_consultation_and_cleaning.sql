-- Two real services the assistant has been assuming exist for a while.
--
-- The WhatsApp assistant already falls back to "General consultation" when a
-- patient doesn't know what they need, and patients routinely ask for
-- "تنظيف اسنان" (a cleaning) — neither existed as a real row, so both were
-- prompt-side fiction with nothing backing them on the actual website.
-- Added as real, published services so the site and the assistant show the
-- same thing, sourced from the same table, rather than the assistant quoting
-- a label the clinic never actually listed.
--
-- sort_order continues from 11 (the last "our_services" row before the
-- "laser" kind group starts at 20), so both sit near the top of the ordinary
-- services list, not appended after the laser-specific treatments.
--
-- Rollback:
--   DELETE FROM public.services WHERE slug IN ('general-consultation', 'cleaning');
--   UPDATE public.services SET deleted_at = NULL, updated_at = now() WHERE slug = 'untitled';

INSERT INTO public.services (
  title, title_ar, description, description_ar, kind, tags, sort_order, is_published, slug
)
SELECT * FROM (VALUES
  (
    'General consultation', 'كشف واستشارة',
    'An exam and consultation with the dentist, who recommends the right treatment for you.',
    'كشف وفحص من الدكتور، وتحديد العلاج المناسب لحالتك.',
    'our_services', ARRAY['Consultation']::text[], 12, true, 'general-consultation'
  ),
  (
    'Cleaning', 'تنظيف الأسنان',
    'Professional teeth cleaning to remove plaque and tartar buildup.',
    'تنظيف احترافي للأسنان لإزالة الجير والترسبات.',
    'our_services', ARRAY['Cleaning']::text[], 13, true, 'cleaning'
  )
) AS new_services(title, title_ar, description, description_ar, kind, tags, sort_order, is_published, slug)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.deleted_at IS NULL AND lower(s.title) = lower(new_services.title)
);

-- "Untitled" has sat published and undeleted since the original agency-site
-- migration — visible to nothing (every reader here already filters
-- placeholder titles out), but still live, published data cluttering the
-- table rather than the soft-deleted debt it always should have been.
UPDATE public.services
SET deleted_at = now(), updated_at = now()
WHERE deleted_at IS NULL
  AND lower(trim(title)) IN ('untitled', 'بدون عنوان');
