-- Add media_type to content tables + richer case/featured seeds
-- Rollback: DROP COLUMN media_type from about, case_studies, featured_projects, clients;
--           restore previous seed counts if needed.

ALTER TABLE public.about
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

ALTER TABLE public.featured_projects
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS media_type text NOT NULL DEFAULT 'image'
    CHECK (media_type IN ('image', 'video'));

DELETE FROM public.case_studies;
INSERT INTO public.case_studies (
  title, description, year, category, sort_order, is_published,
  tags, client, director, agency, production_company, media_type
) VALUES
(
  'Deep Space',
  'A cosmic narrative film exploring silence, scale, and light across impossible distances.',
  '2024', 'Film', 1, true,
  ARRAY['Production', 'Design', 'VFX'],
  'Astra Labs', 'Maya Chen', 'Orbit Studio', 'Imagineer', 'image'
),
(
  'Cognac, Louis XIII',
  'Award winning production company Object & Animal reached out for a high-profile Remy Martin campaign — filmed with a bold red laser passing through the setups.',
  '2023', 'Campaign', 2, true,
  ARRAY['Production', 'Design', 'VFX'],
  'Rémy Martin', 'Benjamin Mialot', 'Fred & Farid', 'Object & Animal', 'image'
),
(
  'Adult Swim, Dream Corp',
  'Surreal branded worlds for Adult Swim — motion, type, and absurd comedy in one package.',
  '2022', 'TV', 3, true,
  ARRAY['Motion', 'Design'],
  'Adult Swim', 'Studio Team', 'Williams Street', 'Dream Corp', 'image'
),
(
  'Hawthorn Brand Film',
  'Nature-led identity film tying landscape texture to a quiet, premium product story.',
  '2025', 'Brand', 4, true,
  ARRAY['Film', 'Brand'],
  'Hawthorn', 'Galil', 'Imagineer', 'Imagineer', 'image'
),
(
  'Northline Expedition',
  'A cold-climate product film shot across ridge lines — wind, steel, and long lenses.',
  '2024', 'Film', 5, true,
  ARRAY['Film', 'Product'],
  'Northline', 'A. Rivera', 'Field Office', 'Imagineer', 'image'
),
(
  'Harbor Night Market',
  'Documentary-style spots capturing coastal vendors, neon, and late-night energy.',
  '2023', 'Doc', 6, true,
  ARRAY['Doc', 'Motion'],
  'Harbor Co', 'L. Okonkwo', 'Tide Agency', 'Imagineer', 'image'
),
(
  'Atlas Desert Run',
  'High-contrast campaign across dunes — heat shimmer, silhouettes, and graphic titles.',
  '2023', 'Campaign', 7, true,
  ARRAY['Campaign', 'VFX'],
  'Atlas', 'S. Park', 'Mirage', 'Imagineer', 'image'
),
(
  'Velvet Frequency',
  'Audio brand world-building with tactile motion and abstract soundscapes.',
  '2025', 'Motion', 8, true,
  ARRAY['Motion', 'Sound'],
  'Velvet', 'Galil', 'Imagineer', 'Imagineer', 'image'
),
(
  'Cascade Soft Goods',
  'Soft-focus product film for apparel — fabric detail, rain, and quiet confidence.',
  '2024', 'Product', 9, true,
  ARRAY['Product', 'Film'],
  'Cascade', 'M. Ellis', 'Soft Studio', 'Imagineer', 'image'
),
(
  'Signal City',
  'Urban kinetic titles and live-action hybrid for a connectivity brand launch.',
  '2022', 'Launch', 10, true,
  ARRAY['Launch', 'Design'],
  'Signal', 'R. Quinn', 'Grid', 'Imagineer', 'image'
);

DELETE FROM public.featured_projects;
INSERT INTO public.featured_projects (
  title, eyebrow, sort_order, is_published, meta_left, meta_right, media_type
) VALUES
  ('Hawthorn', 'Inspired by nature.', 1, true, 'Location · Atacama', '2025 · Brand', 'image'),
  ('Northline', 'Inspired by nature.', 2, true, 'Location · Cascades', '2024 · Film', 'image'),
  ('Harbor', 'Inspired by nature.', 3, true, 'Location · Pacific', '2024 · Product', 'image'),
  ('Atlas', 'Inspired by nature.', 4, true, 'Location · Sahara', '2023 · Campaign', 'image'),
  ('Velvet', 'Inspired by nature.', 5, true, 'Location · Iceland', '2025 · Motion', 'image'),
  ('Cascade', 'Inspired by nature.', 6, true, 'Location · Alps', '2024 · Apparel', 'image'),
  ('Signal', 'Inspired by nature.', 7, true, 'Location · Tokyo', '2022 · Launch', 'image'),
  ('Orbit', 'Inspired by nature.', 8, true, 'Location · Low Earth', '2024 · Film', 'image'),
  ('Tide', 'Inspired by nature.', 9, true, 'Location · Cornwall', '2023 · Doc', 'image'),
  ('Mirage', 'Inspired by nature.', 10, true, 'Location · Dubai', '2025 · Campaign', 'image');
