-- Homepage section visibility + editable section titles for the dental site.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS homepage_hidden_sections text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS about_title text NOT NULL DEFAULT 'About Us',
  ADD COLUMN IF NOT EXISTS gallery_title text NOT NULL DEFAULT 'Gallery',
  ADD COLUMN IF NOT EXISTS gallery_heading text NOT NULL DEFAULT 'Clinic highlights & smile results',
  ADD COLUMN IF NOT EXISTS gallery_description text NOT NULL DEFAULT 'Explore treatment imagery, clinic visuals, and before-and-after results from The Dental Lounge.',
  ADD COLUMN IF NOT EXISTS solutions_title text NOT NULL DEFAULT 'Comprehensive solutions for the perfect smile',
  ADD COLUMN IF NOT EXISTS solutions_description text NOT NULL DEFAULT 'Take a step toward a perfect smile with modern laser technology and personalized care.',
  ADD COLUMN IF NOT EXISTS services_heading text NOT NULL DEFAULT 'Focused treatments with modern technology',
  ADD COLUMN IF NOT EXISTS slider_heading text NOT NULL DEFAULT 'More clinic & treatment highlights',
  ADD COLUMN IF NOT EXISTS contact_title text NOT NULL DEFAULT 'Contact';

UPDATE public.site_settings SET
  about_title = COALESCE(NULLIF(about_title, ''), 'About Us'),
  gallery_title = COALESCE(NULLIF(gallery_title, ''), 'Gallery'),
  gallery_heading = COALESCE(NULLIF(gallery_heading, ''), 'Clinic highlights & smile results'),
  gallery_description = COALESCE(
    NULLIF(gallery_description, ''),
    'Explore treatment imagery, clinic visuals, and before-and-after results from The Dental Lounge.'
  ),
  solutions_title = COALESCE(NULLIF(solutions_title, ''), 'Comprehensive solutions for the perfect smile'),
  solutions_description = COALESCE(
    NULLIF(solutions_description, ''),
    'Take a step toward a perfect smile with modern laser technology and personalized care.'
  ),
  services_heading = COALESCE(NULLIF(services_heading, ''), 'Focused treatments with modern technology'),
  slider_heading = COALESCE(NULLIF(slider_heading, ''), 'More clinic & treatment highlights'),
  contact_title = COALESCE(NULLIF(contact_title, ''), 'Contact'),
  services_title = COALESCE(NULLIF(services_title, ''), 'Our Services'),
  services_description = COALESCE(
    NULLIF(services_description, ''),
    'A selection of laser-supported and cosmetic dentistry services offered with precision and patient comfort in mind.'
  ),
  featured_title = COALESCE(NULLIF(featured_title, ''), 'More Images'),
  featured_description = COALESCE(
    NULLIF(featured_description, ''),
    'Browse more visuals from the clinic, treatment technology, and smile cases in a rotating slider.'
  ),
  contact_headline = COALESCE(NULLIF(contact_headline, ''), 'Book your visit')
WHERE id IS NOT NULL;
