-- Replace portfolio seed rows with Dental Lounge content using local /dental/ assets.
-- Rollback: restore from backup or re-run portfolio seed migrations.

-- About secondary image (small before/after visual)
UPDATE public.about SET
  copy_image_url = '/dental/771453934_18084846845253727_4216909913248468130_n.jpg',
  copy_media_type = 'image'
WHERE id IS NOT NULL;

-- Site copy aligned with index.html
UPDATE public.site_settings SET
  services_title = 'Our Services',
  services_description = 'A selection of laser-supported and cosmetic dentistry services offered with precision and patient comfort in mind.',
  featured_title = 'More Images',
  featured_description = 'Browse more visuals from the clinic, treatment technology, and smile cases in a rotating slider.'
WHERE id IS NOT NULL;

-- Dental trust row (idempotent refresh)
DELETE FROM public.about_trust_items;
INSERT INTO public.about_trust_items (value, label, sort_order) VALUES
  ('Laser-focused', 'Precision care', 0),
  ('New Cairo', 'Ozone Medical Center', 1),
  ('Comfort-first', 'Patient experience', 2);

-- Solution panels
DELETE FROM public.solution_panels;
INSERT INTO public.solution_panels (variant, title, body, image_url, link_href, sort_order) VALUES
  (
    'dark',
    'Laser dentistry solution',
    'Precise, comfort-first laser treatments for gum reshaping, whitening support, and faster healing.',
    '/dental/769375317_18084823622253727_452713876016021475_n.jpg',
    '#gallery',
    0
  ),
  (
    'photo',
    'Find the right dentist for you',
    '',
    '/dental/769385837_18084847031253727_8666198053893142707_n.jpg',
    '#contact',
    1
  ),
  (
    'dark',
    'Smile results with precision',
    'Because every smile deserves careful planning, modern tools, and confident results.',
    '/dental/772697015_18085465295253727_2050281078110971810_n.jpg',
    '#gallery',
    2
  );

-- Gallery showcase + cards
DELETE FROM public.gallery_showcase;
INSERT INTO public.gallery_showcase (image_url, alt_text) VALUES
  (
    '/dental/771453934_18084846845253727_4216909913248468130_n.jpg',
    'Before, during, and after orthodontic smile result'
  );

DELETE FROM public.gallery_items;
INSERT INTO public.gallery_items (image_url, caption, category, sort_order, is_published) VALUES
  ('/dental/769385837_18084847031253727_8666198053893142707_n.jpg', 'Meet Dr. Karim Elshibiny', 'clinic', 0, true),
  ('/dental/769375317_18084823622253727_452713876016021475_n.jpg', 'Laser Technology', 'technology', 1, true),
  ('/dental/774361792_18086030342253727_5992595618828369379_n.jpg', 'Frenectomy Result', 'results', 2, true);

-- Eight dental service cards from index.html
UPDATE public.services SET deleted_at = now() WHERE deleted_at IS NULL;

INSERT INTO public.services (title, tags, description, image_url, media_type, sort_order, is_published) VALUES
  (
    'Gingivectomy',
    ARRAY[]::text[],
    'Removes excess gum tissue and reshapes the gum line.',
    '/dental/769375317_18084823622253727_452713876016021475_n.jpg',
    'image',
    0,
    true
  ),
  (
    'Frenectomy',
    ARRAY[]::text[],
    'Releases abnormal frenum attachments quickly and comfortably.',
    '/dental/774361792_18086030342253727_5992595618828369379_n.jpg',
    'image',
    1,
    true
  ),
  (
    'Teeth Whitening',
    ARRAY[]::text[],
    'Removes stains and discoloration for a brighter smile.',
    '/dental/771453934_18084846845253727_4216909913248468130_n.jpg',
    'image',
    2,
    true
  ),
  (
    'TMJ Pain Therapy',
    ARRAY[]::text[],
    'Relieves pain and inflammation in jaw muscles and TMJ.',
    '/dental/772401978_18085208630253727_984276698240454703_n.jpg',
    'image',
    3,
    true
  ),
  (
    'Oral Ulcer Removal',
    ARRAY[]::text[],
    'Relieves pain and promotes faster healing of mouth ulcers.',
    '/dental/771892527_18084817961253727_5445355793744516179_n.jpg',
    'image',
    4,
    true
  ),
  (
    'Perio Pockets Treatment',
    ARRAY[]::text[],
    'Reduces bacteria and inflammation in periodontal pockets.',
    '/dental/772373432_18085267421253727_8239745368432957963_n.jpg',
    'image',
    5,
    true
  ),
  (
    'Endodontic Treatment',
    ARRAY[]::text[],
    'Disinfects root canals effectively and supports faster recovery.',
    '/dental/771997664_18085564919253727_2931628136836544374_n.jpg',
    'image',
    6,
    true
  ),
  (
    'Oral Surgeries',
    ARRAY[]::text[],
    'Precise cutting, minimal bleeding, and faster recovery.',
    '/dental/772714531_18085751501253727_988432266487528892_n.jpg',
    'image',
    7,
    true
  );

-- Slider images (featured_projects table)
UPDATE public.featured_project_sections
SET deleted_at = now()
WHERE deleted_at IS NULL;

UPDATE public.featured_projects
SET deleted_at = now()
WHERE deleted_at IS NULL;

INSERT INTO public.featured_projects (
  title,
  eyebrow,
  slug,
  sort_order,
  is_published,
  media_type,
  image_url
) VALUES
  ('Clinic highlight 1', '', 'dental-slider-1', 0, true, 'image', '/dental/771844919_18084846794253727_2495961933820976843_n.jpg'),
  ('Clinic highlight 2', '', 'dental-slider-2', 1, true, 'image', '/dental/771892527_18084817961253727_5445355793744516179_n.jpg'),
  ('Clinic highlight 3', '', 'dental-slider-3', 2, true, 'image', '/dental/771892527_18084898616253727_5560745852592328857_n.jpg'),
  ('Clinic highlight 4', '', 'dental-slider-4', 3, true, 'image', '/dental/771997664_18085564919253727_2931628136836544374_n.jpg'),
  ('Clinic highlight 5', '', 'dental-slider-5', 4, true, 'image', '/dental/771998510_18084989687253727_611893741829188574_n.jpg'),
  ('Clinic highlight 6', '', 'dental-slider-6', 5, true, 'image', '/dental/772373432_18085267421253727_8239745368432957963_n.jpg'),
  ('Clinic highlight 7', '', 'dental-slider-7', 6, true, 'image', '/dental/772401978_18085208630253727_984276698240454703_n.jpg'),
  ('Clinic highlight 8', '', 'dental-slider-8', 7, true, 'image', '/dental/772697015_18085465295253727_2050281078110971810_n.jpg'),
  ('Clinic highlight 9', '', 'dental-slider-9', 8, true, 'image', '/dental/772714531_18085751501253727_988432266487528892_n.jpg'),
  ('Clinic highlight 10', '', 'dental-slider-10', 9, true, 'image', '/dental/774744788_18086374004253727_6769576540960911746_n.jpg');

-- Footer navigation matching index.html
UPDATE public.footer_links SET deleted_at = now() WHERE deleted_at IS NULL;

INSERT INTO public.footer_links (column_key, label, href, sort_order, display_mode) VALUES
  ('portfolio', 'About', '#about', 0, 'text'),
  ('portfolio', 'Services', '#services', 1, 'text'),
  ('portfolio', 'Gallery', '#gallery', 2, 'text'),
  ('portfolio', 'More Images', '#more-images', 3, 'text'),
  ('portfolio', 'Contact', '#contact', 4, 'text');
