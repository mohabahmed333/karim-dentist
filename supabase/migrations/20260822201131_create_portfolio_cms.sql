-- Portfolio CMS schema for glil / Imagineer
-- Rollback: drop tables/policies/buckets created below (destructive).

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.deleted_at IS NULL
  );
$$;

CREATE TABLE IF NOT EXISTS public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name text NOT NULL DEFAULT 'Imagineer',
  footer_tagline text NOT NULL DEFAULT 'Think. Design. Develop. Launch. Repeat.',
  contact_email text NOT NULL DEFAULT 'hello@imagineer.studio',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hero (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kicker text NOT NULL DEFAULT 'Portfolio · 2026',
  headline text NOT NULL DEFAULT 'Your Name —',
  accent text NOT NULL DEFAULT 'design that moves',
  body text NOT NULL DEFAULT '',
  cta_primary_label text NOT NULL DEFAULT 'View the work',
  cta_primary_href text NOT NULL DEFAULT '#work',
  cta_secondary_label text NOT NULL DEFAULT 'Get in touch',
  cta_secondary_href text NOT NULL DEFAULT '#contact',
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  media_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.about (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text,
  drop_cap text NOT NULL DEFAULT 'G',
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.callouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  body text NOT NULL DEFAULT 'THE TALES WE HOLD … ARE THE ONES THAT TRULY MATTER.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.case_studies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  media_url text,
  year text,
  category text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.featured_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  eyebrow text NOT NULL DEFAULT 'Inspired by nature',
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.experience_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  org text,
  date_label text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.footer_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  column_key text NOT NULL CHECK (column_key IN ('portfolio', 'resources', 'follow')),
  label text NOT NULL,
  href text NOT NULL DEFAULT '#',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.social_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL,
  href text NOT NULL DEFAULT '#',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS case_studies_sort_idx ON public.case_studies (sort_order)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS featured_projects_sort_idx ON public.featured_projects (sort_order)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS experience_entries_sort_idx ON public.experience_entries (sort_order)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS clients_sort_idx ON public.clients (sort_order)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS footer_links_col_sort_idx ON public.footer_links (column_key, sort_order)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS social_links_sort_idx ON public.social_links (sort_order)
  WHERE deleted_at IS NULL;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.about ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Profiles: users read own; admins manage all
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS profiles_update_admin ON public.profiles;
CREATE POLICY profiles_update_admin ON public.profiles
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Public read + admin write helpers for content
DROP POLICY IF EXISTS site_settings_public_read ON public.site_settings;
CREATE POLICY site_settings_public_read ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS site_settings_admin_write ON public.site_settings;
CREATE POLICY site_settings_admin_write ON public.site_settings
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS hero_public_read ON public.hero;
CREATE POLICY hero_public_read ON public.hero
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS hero_admin_write ON public.hero;
CREATE POLICY hero_admin_write ON public.hero
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS about_public_read ON public.about;
CREATE POLICY about_public_read ON public.about
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS about_admin_write ON public.about;
CREATE POLICY about_admin_write ON public.about
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS callouts_public_read ON public.callouts;
CREATE POLICY callouts_public_read ON public.callouts
  FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS callouts_admin_write ON public.callouts;
CREATE POLICY callouts_admin_write ON public.callouts
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS case_studies_public_read ON public.case_studies;
CREATE POLICY case_studies_public_read ON public.case_studies
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND is_published = true);
DROP POLICY IF EXISTS case_studies_admin_all ON public.case_studies;
CREATE POLICY case_studies_admin_all ON public.case_studies
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS featured_projects_public_read ON public.featured_projects;
CREATE POLICY featured_projects_public_read ON public.featured_projects
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND is_published = true);
DROP POLICY IF EXISTS featured_projects_admin_all ON public.featured_projects;
CREATE POLICY featured_projects_admin_all ON public.featured_projects
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS experience_public_read ON public.experience_entries;
CREATE POLICY experience_public_read ON public.experience_entries
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);
DROP POLICY IF EXISTS experience_admin_all ON public.experience_entries;
CREATE POLICY experience_admin_all ON public.experience_entries
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS clients_public_read ON public.clients;
CREATE POLICY clients_public_read ON public.clients
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);
DROP POLICY IF EXISTS clients_admin_all ON public.clients;
CREATE POLICY clients_admin_all ON public.clients
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS footer_links_public_read ON public.footer_links;
CREATE POLICY footer_links_public_read ON public.footer_links
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);
DROP POLICY IF EXISTS footer_links_admin_all ON public.footer_links;
CREATE POLICY footer_links_admin_all ON public.footer_links
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS social_links_public_read ON public.social_links;
CREATE POLICY social_links_public_read ON public.social_links
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL);
DROP POLICY IF EXISTS social_links_admin_all ON public.social_links;
CREATE POLICY social_links_admin_all ON public.social_links
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Storage buckets (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('hero', 'hero', true),
  ('about', 'about', true),
  ('projects', 'projects', true),
  ('clients', 'clients', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS storage_public_read_portfolio ON storage.objects;
CREATE POLICY storage_public_read_portfolio ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id IN ('hero', 'about', 'projects', 'clients'));

DROP POLICY IF EXISTS storage_admin_write_portfolio ON storage.objects;
CREATE POLICY storage_admin_write_portfolio ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('hero', 'about', 'projects', 'clients')
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id IN ('hero', 'about', 'projects', 'clients')
    AND public.is_admin()
  );
