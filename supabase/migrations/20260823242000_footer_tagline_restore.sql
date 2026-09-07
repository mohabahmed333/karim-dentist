-- Restore footer tagline copy
UPDATE public.site_settings
SET footer_tagline = 'Think. Design. Develop. Launch. Repeat.'
WHERE footer_tagline = 'The Tales We Hold Within';
