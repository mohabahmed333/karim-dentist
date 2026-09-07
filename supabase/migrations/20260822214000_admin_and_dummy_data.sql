-- Admin profile + richer dummy CMS content
-- Rollback: delete seeded rows / demote profile as needed.

-- Promote the first auth user to admin when one exists (no hardcoded user id).
INSERT INTO public.profiles (id, role, display_name)
SELECT
  u.id,
  'admin',
  COALESCE(u.raw_user_meta_data ->> 'full_name', 'Admin')
FROM auth.users AS u
ORDER BY u.created_at
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET role = 'admin',
    display_name = EXCLUDED.display_name,
    deleted_at = NULL,
    updated_at = now();

UPDATE public.site_settings
SET
  brand_name = 'Imagineer',
  footer_tagline = 'Think. Design. Develop. Launch. Repeat.',
  contact_email = 'hello@imagineer.studio',
  updated_at = now();

UPDATE public.hero
SET
  kicker = 'Portfolio · 2026',
  headline = 'Galil —',
  accent = 'design that moves',
  body = 'Scroll to scrub through a featured film. Brand stories, product motion, and craft from Cairo to Riyadh.',
  cta_primary_label = 'View the work',
  cta_primary_href = '#case-studies',
  cta_secondary_label = 'Get in touch',
  cta_secondary_href = '#contact',
  media_type = 'video',
  media_url = '/hero/desktop.mp4',
  media_url_desktop = '/hero/desktop.mp4',
  media_url_mobile = '/hero/mobile.mp4',
  updated_at = now();

UPDATE public.about
SET
  drop_cap = 'G',
  body = 'once upon a time, a designer named Galil left Cairo for Riyadh with a sketchbook and a stubborn eye for craft. A decade later, the work still starts the same way — with a tale worth telling, then the pixels that make it land.',
  updated_at = now();

UPDATE public.callouts
SET
  body = 'THE TALES WE HOLD … ARE THE ONES THAT TRULY MATTER.',
  updated_at = now();

-- Refresh list tables with clean dummy sets
DELETE FROM public.case_studies;
INSERT INTO public.case_studies
  (title, description, year, category, sort_order, is_published)
VALUES
  ('Space', 'Atmospheric film and identity for a launch that needed quiet gravity.', '2024', 'Film', 1, true),
  ('Cognac, Louis XIII', 'Premium stills and motion for a heritage spirit campaign.', '2023', 'Campaign', 2, true),
  ('Hawthorn', 'Nature-led brand system across posters, packaging, and digital.', '2025', 'Brand', 3, true),
  ('Northline Studio', 'Identity and launch film for an architecture practice.', '2025', 'Brand', 4, true);

DELETE FROM public.featured_projects;
INSERT INTO public.featured_projects
  (title, eyebrow, sort_order, is_published)
VALUES
  ('Hawthorn', 'Inspired by nature', 1, true),
  ('Northline', 'Inspired by nature', 2, true),
  ('Harbor', 'Inspired by nature', 3, true),
  ('Atlas', 'Inspired by nature', 4, true),
  ('Velvet', 'Inspired by nature', 5, true);

DELETE FROM public.experience_entries;
INSERT INTO public.experience_entries
  (title, org, date_label, sort_order)
VALUES
  ('Design Lead', 'Imagineer Studio', '2022 — Present', 1),
  ('Senior Product Designer', 'Studio North', '2019 — 2022', 2),
  ('Brand Designer', 'Independent', '2016 — 2019', 3);

DELETE FROM public.clients;
INSERT INTO public.clients (name, sort_order) VALUES
  ('PlayStation', 1), ('BBC', 2), ('Nike', 3), ('IBM', 4),
  ('Jaguar', 5), ('Google', 6), ('Virgin', 7), ('Rolls-Royce', 8),
  ('Sony', 9), ('Discord', 10), ('Land Rover', 11), ('Adobe', 12),
  ('Spotify', 13), ('Airbnb', 14);

DELETE FROM public.footer_links;
INSERT INTO public.footer_links (column_key, label, href, sort_order) VALUES
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
  ('follow', 'Instagram', 'https://instagram.com', 1),
  ('follow', 'Dribbble', 'https://dribbble.com', 2),
  ('follow', 'LinkedIn', 'https://linkedin.com', 3),
  ('follow', 'Behance', 'https://behance.net', 4),
  ('follow', 'GitHub', 'https://github.com', 5);

DELETE FROM public.social_links;
INSERT INTO public.social_links (platform, href, sort_order) VALUES
  ('Instagram', 'https://instagram.com', 1),
  ('Dribbble', 'https://dribbble.com', 2),
  ('LinkedIn', 'https://linkedin.com', 3),
  ('Behance', 'https://behance.net', 4),
  ('Twitter', 'https://x.com', 5),
  ('GitHub', 'https://github.com', 6),
  ('YouTube', 'https://youtube.com', 7);
