-- More featured carousel cards + case study seeds with design images
-- Rollback: soft-delete rows inserted here by title/slug if needed.

INSERT INTO public.featured_projects (
  title,
  eyebrow,
  slug,
  sort_order,
  is_published,
  meta_left,
  meta_right,
  media_type,
  image_url
)
VALUES
  (
    'VOI Alt',
    'Carousel',
    NULL,
    6,
    true,
    'Riyadh · KSA',
    '2025 · Identity',
    'image',
    '/design/voi.png'
  ),
  (
    'Dallah Gulf Alt',
    'Carousel',
    NULL,
    7,
    true,
    'Gulf region',
    '2024 · Campaign',
    'image',
    '/design/dallah-gulf.png'
  ),
  (
    'Studio Portrait',
    'Behind the scenes',
    NULL,
    8,
    true,
    'Imagineer',
    'Studio',
    'image',
    '/design/about-portrait.png'
  );

UPDATE public.case_studies
SET deleted_at = now()
WHERE deleted_at IS NULL;

INSERT INTO public.case_studies (
  title,
  description,
  slug,
  year,
  category,
  sort_order,
  is_published,
  tags,
  client,
  director,
  agency,
  production_company,
  media_type,
  media_url
)
VALUES
  (
    'VOI Brand Film',
    'A launch film and stills package for VOI — kinetic type, product hero frames, and a distilled palette built for Gulf retail and digital.',
    'voi-brand-film',
    '2025',
    'Brand',
    1,
    true,
    ARRAY['Film', 'Identity', 'Launch'],
    'VOI',
    'Galil',
    'Imagineer',
    'Imagineer',
    'image',
    '/design/voi.png'
  ),
  (
    'Dallah Gulf Campaign',
    'Regional campaign art direction for Dallah Gulf — institutional trust with warmer photography, outdoor layouts, and social cutdowns.',
    'dallah-gulf-campaign',
    '2024',
    'Campaign',
    2,
    true,
    ARRAY['Campaign', 'Print', 'Digital'],
    'Dallah Gulf',
    'M. Hassan',
    'Field Office',
    'Imagineer',
    'image',
    '/design/dallah-gulf.png'
  ),
  (
    'The Dental Hub',
    'Healthcare brand film balancing clinical clarity with lifestyle warmth — appointment flows, interiors, and smile-led portraits.',
    'the-dental-hub-film',
    '2024',
    'Healthcare',
    3,
    true,
    ARRAY['Healthcare', 'Film', 'Brand'],
    'The Dental Hub',
    'Galil',
    'Imagineer',
    'Imagineer',
    'image',
    '/design/the-dental-hub.png'
  ),
  (
    'The Good Bowl',
    'Food campaign spanning menu boards, delivery apps, and in-store posters — bold bowl photography and playful headline stacks.',
    'the-good-bowl-campaign',
    '2025',
    'Food',
    4,
    true,
    ARRAY['Packaging', 'Campaign', 'Food'],
    'The Good Bowl',
    'A. Rivera',
    'Tide Agency',
    'Imagineer',
    'image',
    '/design/the-good-bowl.png'
  ),
  (
    'Say Galil',
    'Studio statement film celebrating the designer behind Imagineer — serif type, minimal form, and a black-and-white voice.',
    'say-galil',
    '2026',
    'Studio',
    5,
    true,
    ARRAY['Studio', 'Identity', 'Film'],
    'Imagineer',
    'Galil',
    'Imagineer',
    'Imagineer',
    'image',
    '/design/say-galil.png'
  ),
  (
    'Hero Reel Frame',
    'Selected frame from the homepage hero scrub — atmospheric light, scale, and motion used as a carousel-only case study card.',
    NULL,
    '2026',
    'Film',
    6,
    true,
    ARRAY['Hero', 'Motion'],
    'Imagineer',
    'Galil',
    'Imagineer',
    'Imagineer',
    'image',
    '/design/hero.jpg'
  ),
  (
    'Brand Mark Exploration',
    'Logo construction study for the studio mark — geometry, stroke weight, and monochrome lockups without a dedicated case-study page.',
    NULL,
    '2025',
    'Identity',
    7,
    true,
    ARRAY['Identity', 'Logo'],
    'Imagineer',
    'Galil',
    'Imagineer',
    'Imagineer',
    'image',
    '/design/brand-logo.png'
  );

INSERT INTO public.case_study_sections (
  case_study_id,
  type,
  layout_variant,
  content,
  sort_order
)
SELECT
  cs.id,
  'text',
  'intro',
  jsonb_build_object(
    'heading', 'Introduction',
    'body', cs.description,
    'width', 'medium',
    'align', 'left'
  ),
  0
FROM public.case_studies cs
WHERE cs.deleted_at IS NULL
  AND cs.slug IS NOT NULL;

INSERT INTO public.case_study_sections (
  case_study_id,
  type,
  layout_variant,
  content,
  sort_order
)
SELECT
  cs.id,
  'media',
  'full',
  jsonb_build_object(
    'media_url', cs.media_url,
    'media_type', 'image',
    'alt', cs.title,
    'caption', '',
    'aspect_ratio', '16/9',
    'object_position', 'center'
  ),
  1
FROM public.case_studies cs
WHERE cs.deleted_at IS NULL
  AND cs.slug IS NOT NULL
  AND cs.media_url IS NOT NULL;

INSERT INTO public.case_study_sections (
  case_study_id,
  type,
  layout_variant,
  content,
  sort_order
)
SELECT
  cs.id,
  'text',
  'default',
  jsonb_build_object(
    'heading', 'Overview',
    'body',
    CASE cs.slug
      WHEN 'voi-brand-film' THEN
        'The film ties the VOI wordmark to product moments — macro textures, retail signage, and app UI in one continuous grade.'
      WHEN 'dallah-gulf-campaign' THEN
        'Key visuals and typographic hierarchy let regional teams ship on-brand assets quickly across print, outdoor, and social.'
      WHEN 'the-dental-hub-film' THEN
        'Wayfinding, appointment cards, and social templates share one modular kit — photography keeps smiles bright while interiors stay calm.'
      WHEN 'the-good-bowl-campaign' THEN
        'Label hierarchies were tuned for shelf distance and thumb-scroll speed, keeping the brand energetic but never noisy.'
      WHEN 'say-galil' THEN
        'Galil brings more than a decade of art direction from Cairo to Riyadh — collaborating on film, campaign, and identity work that travels.'
      ELSE ''
    END,
    'width', 'medium',
    'align', 'left'
  ),
  2
FROM public.case_studies cs
WHERE cs.deleted_at IS NULL
  AND cs.slug IS NOT NULL;

UPDATE public.site_settings
SET
  case_studies_title = 'Case Studies',
  case_studies_description =
    'Films, campaigns, and brand worlds from the studio — including VOI, Dallah Gulf, The Dental Hub, The Good Bowl, and Say Galil. Carousel-only cards stay on the index until a full page is built.',
  featured_description =
    'Selected identity, campaign, and packaging work — including full project pages for VOI, Dallah Gulf, The Dental Hub, The Good Bowl, and Say Galil, plus carousel-only alternates.'
WHERE id IS NOT NULL;
