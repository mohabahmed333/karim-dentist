-- Seed Imagineer / Galil placeholder content
-- Rollback: DELETE FROM seeded tables (keep schema).

INSERT INTO public.site_settings (brand_name, footer_tagline, contact_email)
SELECT 'Imagineer', 'Think. Design. Develop. Launch. Repeat.', 'hello@imagineer.studio'
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings);

INSERT INTO public.hero (
  kicker, headline, accent, body,
  cta_primary_label, cta_primary_href,
  cta_secondary_label, cta_secondary_href,
  media_type, media_url
)
SELECT
  'Portfolio · 2026',
  'Galil —',
  'design that moves',
  'Scroll to dive through featured pieces — brand films, product stories, and work built to feel intentional.',
  'View the work',
  '#case-studies',
  'Get in touch',
  '#contact',
  'image',
  NULL
WHERE NOT EXISTS (SELECT 1 FROM public.hero);

INSERT INTO public.about (image_url, drop_cap, body)
SELECT
  NULL,
  'G',
  'once upon a time, a designer named Galil left Cairo for Riyadh with a sketchbook and a stubborn eye for craft. A decade later, the work still starts the same way — with a tale worth telling, then the pixels that make it land.'
WHERE NOT EXISTS (SELECT 1 FROM public.about);

INSERT INTO public.callouts (body)
SELECT 'THE TALES WE HOLD … ARE THE ONES THAT TRULY MATTER.'
WHERE NOT EXISTS (SELECT 1 FROM public.callouts);

INSERT INTO public.case_studies (title, description, year, category, sort_order, is_published)
SELECT * FROM (VALUES
  ('Space', 'Atmospheric film and identity for a launch narrative that needed quiet gravity.', '2024', 'Film', 1, true),
  ('Cognac, Louis XIII', 'Premium stills and motion for a heritage spirit campaign.', '2023', 'Campaign', 2, true),
  ('Hawthorn', 'Nature-led brand system across posters, packaging, and digital.', '2025', 'Brand', 3, true)
) AS v(title, description, year, category, sort_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.case_studies);

INSERT INTO public.featured_projects (title, eyebrow, sort_order, is_published)
SELECT * FROM (VALUES
  ('Hawthorn', 'Inspired by nature', 1, true),
  ('Northline', 'Inspired by nature', 2, true),
  ('Harbor', 'Inspired by nature', 3, true),
  ('Atlas', 'Inspired by nature', 4, true),
  ('Velvet', 'Inspired by nature', 5, true)
) AS v(title, eyebrow, sort_order, is_published)
WHERE NOT EXISTS (SELECT 1 FROM public.featured_projects);

INSERT INTO public.experience_entries (title, org, date_label, sort_order)
SELECT * FROM (VALUES
  ('Design Lead', 'Imagineer Studio', '2022 — Present', 1),
  ('Senior Product Designer', 'Studio North', '2019 — 2022', 2),
  ('Brand Designer', 'Independent', '2016 — 2019', 3)
) AS v(title, org, date_label, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.experience_entries);

INSERT INTO public.clients (name, sort_order)
SELECT * FROM (VALUES
  ('PlayStation', 1), ('BBC', 2), ('Nike', 3), ('IBM', 4),
  ('Jaguar', 5), ('Google', 6), ('Virgin', 7), ('Rolls-Royce', 8),
  ('Sony', 9), ('Discord', 10), ('Land Rover', 11), ('Adobe', 12),
  ('Spotify', 13), ('Airbnb', 14)
) AS v(name, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.clients);

INSERT INTO public.footer_links (column_key, label, href, sort_order)
SELECT * FROM (VALUES
  ('portfolio', 'Home', '#top', 1),
  ('portfolio', 'Projects', '#featured', 2),
  ('portfolio', 'Services', '#case-studies', 3),
  ('portfolio', 'About', '#about', 4),
  ('portfolio', 'Contact us', '#contact', 5),
  ('resources', 'Handbook', '#', 1),
  ('resources', 'Playbook', '#', 2),
  ('resources', 'Mission and Vision', '#', 3),
  ('resources', 'Design', '#', 4),
  ('resources', 'Developments', '#', 5),
  ('follow', 'Instagram', '#', 1),
  ('follow', 'Dribbble', '#', 2),
  ('follow', 'LinkedIn', '#', 3),
  ('follow', 'Behance', '#', 4),
  ('follow', 'GitHub', '#', 5)
) AS v(column_key, label, href, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.footer_links);

INSERT INTO public.social_links (platform, href, sort_order)
SELECT * FROM (VALUES
  ('Instagram', '#', 1),
  ('Dribbble', '#', 2),
  ('LinkedIn', '#', 3),
  ('Behance', '#', 4),
  ('Twitter', '#', 5),
  ('GitHub', '#', 6),
  ('YouTube', '#', 7)
) AS v(platform, href, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.social_links);
