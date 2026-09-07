-- Replace featured projects + page sections with design mock seed data
-- Rollback: soft-delete seeded rows; restore from backup if needed.

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
  meta_left,
  meta_right,
  media_type,
  image_url
)
VALUES
  (
    'VOI',
    'Brand identity',
    'voi',
    1,
    true,
    'Riyadh · KSA',
    '2025 · Identity',
    'image',
    '/design/voi.png'
  ),
  (
    'Dallah Gulf',
    'Corporate campaign',
    'dallah-gulf',
    2,
    true,
    'Gulf region',
    '2024 · Campaign',
    'image',
    '/design/dallah-gulf.png'
  ),
  (
    'The Dental Hub',
    'Healthcare brand',
    'the-dental-hub',
    3,
    true,
    'Clinical · Wellness',
    '2024 · Brand',
    'image',
    '/design/the-dental-hub.png'
  ),
  (
    'The Good Bowl',
    'Food & lifestyle',
    'the-good-bowl',
    4,
    true,
    'Fast casual',
    '2025 · Packaging',
    'image',
    '/design/the-good-bowl.png'
  ),
  (
    'Galil',
    'Say',
    'say-galil',
    5,
    true,
    'Studio',
    'Imagineer',
    'image',
    '/design/say-galil.png'
  );

-- Title blocks
INSERT INTO public.featured_project_sections (
  featured_project_id,
  type,
  layout_variant,
  content,
  sort_order
)
SELECT
  fp.id,
  'title',
  'default',
  jsonb_build_object(
    'title', fp.title,
    'eyebrow', fp.eyebrow
  ),
  0
FROM public.featured_projects fp
WHERE fp.deleted_at IS NULL;

-- Introduction blocks
INSERT INTO public.featured_project_sections (
  featured_project_id,
  type,
  layout_variant,
  content,
  sort_order
)
SELECT
  fp.id,
  'intro',
  'default',
  jsonb_build_object(
    'label', 'Introduction',
    'body',
    CASE fp.slug
      WHEN 'voi' THEN
        'A distilled identity system for VOI — pairing a bold wordmark with a flexible visual language built for product, retail, and digital touchpoints across the Gulf.'
      WHEN 'dallah-gulf' THEN
        'Campaign visuals and art direction for Dallah Gulf, balancing institutional trust with a warmer, contemporary voice across print, outdoor, and social channels.'
      WHEN 'the-dental-hub' THEN
        'A friendly, clinical-meets-lifestyle brand for The Dental Hub — soft palettes, clear typography, and iconography that makes dental care feel approachable.'
      WHEN 'the-good-bowl' THEN
        'Packaging and campaign art for The Good Bowl — vibrant bowl photography, playful type, and a system that scales from menu boards to delivery apps.'
      WHEN 'say-galil' THEN
        'Say Galil — a studio statement piece celebrating the designer behind Imagineer: confident serif typography, minimal form, and a black-and-white voice that anchors the portfolio.'
      ELSE ''
    END
  ),
  1
FROM public.featured_projects fp
WHERE fp.deleted_at IS NULL;

-- Hero media blocks
INSERT INTO public.featured_project_sections (
  featured_project_id,
  type,
  layout_variant,
  content,
  sort_order
)
SELECT
  fp.id,
  'media',
  'full',
  jsonb_build_object(
    'media_url', fp.image_url,
    'media_type', 'image',
    'alt', fp.title,
    'caption', '',
    'aspect_ratio', '16/9',
    'object_position', 'center'
  ),
  2
FROM public.featured_projects fp
WHERE fp.deleted_at IS NULL
  AND fp.image_url IS NOT NULL;

-- Overview text blocks
INSERT INTO public.featured_project_sections (
  featured_project_id,
  type,
  layout_variant,
  content,
  sort_order
)
SELECT
  fp.id,
  'text',
  'default',
  jsonb_build_object(
    'heading', 'Overview',
    'body',
    CASE fp.slug
      WHEN 'voi' THEN
        'The identity extends from logotype construction to color, pattern, and motion rules — giving VOI a recognizable presence whether on packaging, signage, or mobile screens.'
      WHEN 'dallah-gulf' THEN
        'We developed key visuals, layout grids, and typographic hierarchy so regional teams could produce on-brand assets quickly without losing craft or clarity.'
      WHEN 'the-dental-hub' THEN
        'Wayfinding, appointment cards, and social templates share one modular kit — photography direction keeps smiles bright while interiors stay calm and premium.'
      WHEN 'the-good-bowl' THEN
        'Illustration accents and label hierarchies were tuned for legibility at shelf distance and thumb-scroll speed, keeping the brand energetic but never noisy.'
      WHEN 'say-galil' THEN
        'Galil brings more than a decade of art direction from Cairo to Riyadh — collaborating with agencies and in-house teams on film, campaign, and identity work that travels.'
      ELSE ''
    END,
    'width', 'medium',
    'align', 'left'
  ),
  3
FROM public.featured_projects fp
WHERE fp.deleted_at IS NULL;

UPDATE public.site_settings
SET
  featured_title = 'Featured Projects',
  featured_description =
    'Selected identity, campaign, and packaging work from the studio — including VOI, Dallah Gulf, The Dental Hub, The Good Bowl, and the Say Galil studio piece.'
WHERE id IS NOT NULL;
