-- Featured projects: design card images + titles matching homepage mock
UPDATE public.featured_projects
SET deleted_at = now()
WHERE deleted_at IS NULL;

INSERT INTO public.featured_projects (
  title, eyebrow, sort_order, is_published, meta_left, meta_right, media_type, image_url
) VALUES
  ('VOI', 'Featured', 1, true, '', '', 'image', '/design/voi.png'),
  ('Dallah Gulf', 'Featured', 2, true, '', '', 'image', '/design/dallah-gulf.png'),
  ('The Dental Hub', 'Featured', 3, true, '', '', 'image', '/design/the-dental-hub.png'),
  ('The Good Bowl', 'Featured', 4, true, '', '', 'image', '/design/the-good-bowl.png'),
  ('VOI Alt', 'Featured', 5, true, '', '', 'image', '/design/voi.png'),
  ('Dallah Gulf Alt', 'Featured', 6, true, '', '', 'image', '/design/dallah-gulf.png');
