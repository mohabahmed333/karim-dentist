-- Case study credits + featured meta
-- Rollback: drop new columns.

ALTER TABLE public.case_studies
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS client text,
  ADD COLUMN IF NOT EXISTS director text,
  ADD COLUMN IF NOT EXISTS agency text,
  ADD COLUMN IF NOT EXISTS production_company text;

ALTER TABLE public.featured_projects
  ADD COLUMN IF NOT EXISTS meta_left text,
  ADD COLUMN IF NOT EXISTS meta_right text;

DELETE FROM public.case_studies;
INSERT INTO public.case_studies (
  title, description, year, category, sort_order, is_published,
  tags, client, director, agency, production_company
) VALUES
(
  'Deep Space',
  'A cosmic narrative film exploring silence, scale, and light across impossible distances.',
  '2024', 'Film', 1, true,
  ARRAY['Production', 'Design', 'VFX'],
  'Astra Labs', 'Maya Chen', 'Orbit Studio', 'Imagineer'
),
(
  'Cognac, Louis XIII',
  'Award winning production company, Object & Animal, reached out for a high-profile Remy Martin campaign showcasing the exquisite LOUIS XIII Cognac — filmed with a bold red laser passing through the setups.',
  '2023', 'Campaign', 2, true,
  ARRAY['Production', 'Design', 'VFX'],
  'Rémy Martin', 'Benjamin Mialot', 'Fred & Farid', 'Object & Animal'
),
(
  'Adult Swim, Dream Corp',
  'Surreal branded worlds for Adult Swim — motion, type, and absurd comedy in one package.',
  '2022', 'TV', 3, true,
  ARRAY['Motion', 'Design'],
  'Adult Swim', 'Studio Team', 'Williams Street', 'Dream Corp'
),
(
  'Hawthorn Brand Film',
  'Nature-led identity film tying landscape texture to a quiet, premium product story.',
  '2025', 'Brand', 4, true,
  ARRAY['Film', 'Brand'],
  'Hawthorn', 'Galil', 'Imagineer', 'Imagineer'
);

DELETE FROM public.featured_projects;
INSERT INTO public.featured_projects (
  title, eyebrow, sort_order, is_published, meta_left, meta_right
) VALUES
  ('Hawthorn', 'Inspired by nature.', 1, true, 'Location · Atacama', '2025 · Brand'),
  ('Northline', 'Inspired by nature.', 2, true, 'Location · Cascades', '2024 · Film'),
  ('Harbor', 'Inspired by nature.', 3, true, 'Location · Pacific', '2024 · Product'),
  ('Atlas', 'Inspired by nature.', 4, true, 'Location · Sahara', '2023 · Campaign'),
  ('Velvet', 'Inspired by nature.', 5, true, 'Location · Iceland', '2025 · Motion');

DELETE FROM public.clients;
INSERT INTO public.clients (name, sort_order) VALUES
  ('Canyon', 1), ('PlayStation', 2), ('BBC', 3), ('Nike', 4),
  ('Defected', 5), ('Bowers & Wilkins', 6), ('IBM', 7),
  ('Jaguar Land Rover', 8), ('Pottermore', 9), ('Google', 10),
  ('Virgin', 11), ('Culture Club', 12), ('British Airways', 13),
  ('Rolls-Royce', 14);
