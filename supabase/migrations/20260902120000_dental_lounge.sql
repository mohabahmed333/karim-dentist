-- Dental Lounge CMS tables + seed data

CREATE TABLE IF NOT EXISTS public.about_trust_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  value text NOT NULL,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solution_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  variant text NOT NULL DEFAULT 'dark' CHECK (variant IN ('dark', 'photo')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  image_url text NOT NULL,
  link_href text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'clinic',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gallery_showcase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  alt_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.about_trust_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solution_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read about_trust_items"
  ON public.about_trust_items FOR SELECT USING (true);
CREATE POLICY "Admin write about_trust_items"
  ON public.about_trust_items FOR ALL USING (public.is_admin());

CREATE POLICY "Public read solution_panels"
  ON public.solution_panels FOR SELECT USING (true);
CREATE POLICY "Admin write solution_panels"
  ON public.solution_panels FOR ALL USING (public.is_admin());

CREATE POLICY "Public read gallery_items"
  ON public.gallery_items FOR SELECT USING (is_published = true);
CREATE POLICY "Admin read all gallery_items"
  ON public.gallery_items FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin write gallery_items"
  ON public.gallery_items FOR ALL USING (public.is_admin());

CREATE POLICY "Public read gallery_showcase"
  ON public.gallery_showcase FOR SELECT USING (true);
CREATE POLICY "Admin write gallery_showcase"
  ON public.gallery_showcase FOR ALL USING (public.is_admin());

-- Dental brand + homepage order
UPDATE public.site_settings SET
  brand_name = 'The Dental Lounge',
  brand_logo_url = '/dental/766800441_18084577118253727_1449914596899119909_n.jpg',
  footer_tagline = 'Modern laser and cosmetic dentistry with comfort-first care in New Cairo.',
  contact_phone = '+20 111 192 2252',
  contact_mobile = '+20 111 192 2252',
  contact_address = 'A 41 Ozone Medical Center, New Cairo, Al Narges Buildings',
  contact_city = 'New Cairo',
  contact_country = 'Egypt',
  contact_map_url = 'https://www.google.com/maps/search/?api=1&query=A+41+Ozone+Medical+Center,+New+Cairo,+Al+Narges+Buildings',
  contact_whatsapp = '201111922252',
  contact_headline = 'Book your visit',
  contact_blurb = 'Laser & cosmetic dentistry. Appointments by request.',
  services_title = 'Our Services',
  featured_title = 'More Images',
  case_studies_title = 'Smile Results',
  homepage_section_order = ARRAY['about', 'services', 'gallery', 'slider', 'contact']
WHERE id IS NOT NULL;

UPDATE public.hero SET
  kicker = '',
  headline = 'Caring for Your Smile',
  accent = '',
  body = 'Your smile is more than just an expression — it''s a reflection of your confidence, health, and happiness. At The Dental Lounge, Dr. Karim Elshibiny delivers comfort-first laser and cosmetic care.',
  cta_primary_label = 'Set Appointment',
  cta_primary_href = '#contact',
  cta_secondary_label = '',
  cta_secondary_href = '',
  media_type = 'image',
  media_url = '/dental/769385837_18084847031253727_8666198053893142707_n.jpg',
  media_url_desktop = '/dental/769385837_18084847031253727_8666198053893142707_n.jpg',
  media_url_mobile = '/dental/769385837_18084847031253727_8666198053893142707_n.jpg'
WHERE id IS NOT NULL;

UPDATE public.about SET
  image_url = '/dental/769385837_18084847031253727_8666198053893142707_n.jpg',
  drop_cap = 'W',
  body = 'Under the care of Dr. Karim Elshibiny, The Dental Lounge focuses on modern laser dentistry and cosmetic treatments in a calm, patient-friendly clinic environment.'
WHERE id IS NOT NULL;

-- Trust items
INSERT INTO public.about_trust_items (value, label, sort_order) VALUES
  ('Laser-focused', 'Precision care', 0),
  ('New Cairo', 'Ozone Medical Center', 1),
  ('Comfort-first', 'Patient experience', 2)
ON CONFLICT DO NOTHING;

-- Solution panels
INSERT INTO public.solution_panels (variant, title, body, image_url, link_href, sort_order) VALUES
  ('dark', 'Laser dentistry solution', 'Precise, comfort-first laser treatments for gum reshaping, whitening support, and faster healing.', '/dental/769375317_18084823622253727_452713876016021475_n.jpg', '#gallery', 0),
  ('photo', 'Find the right dentist for you', '', '/dental/769385837_18084847031253727_8666198053893142707_n.jpg', '#contact', 1),
  ('dark', 'Smile results with precision', 'Because every smile deserves careful planning, modern tools, and confident results.', '/dental/772697015_18085465295253727_2050281078110971810_n.jpg', '#gallery', 2)
ON CONFLICT DO NOTHING;

-- Gallery showcase
INSERT INTO public.gallery_showcase (image_url, alt_text)
SELECT '/dental/771453934_18084846845253727_4216909913248468130_n.jpg', 'Before, during, and after orthodontic smile result'
WHERE NOT EXISTS (SELECT 1 FROM public.gallery_showcase);

-- Gallery items
INSERT INTO public.gallery_items (image_url, caption, category, sort_order) VALUES
  ('/dental/769385837_18084847031253727_8666198053893142707_n.jpg', 'Meet Dr. Karim Elshibiny', 'clinic', 0),
  ('/dental/769375317_18084823622253727_452713876016021475_n.jpg', 'Laser Technology', 'technology', 1),
  ('/dental/774361792_18086030342253727_5992595618828369379_n.jpg', 'Frenectomy Result', 'results', 2)
ON CONFLICT DO NOTHING;
