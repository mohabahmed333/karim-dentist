-- Align the stored hero headline with the dental theme's editable heading.

UPDATE public.hero
SET headline = 'Caring for Your Smile, One Visit at a Time.',
    updated_at = now()
WHERE headline = 'Caring for Your Smile'
   OR headline = '';
