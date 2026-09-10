-- FAQ section: CMS-managed questions/answers + homepage section copy.
-- Rollback:
--   DROP TABLE IF EXISTS public.faqs;
--   ALTER TABLE public.site_settings
--     DROP COLUMN IF EXISTS faq_title, DROP COLUMN IF EXISTS faq_title_ar,
--     DROP COLUMN IF EXISTS faq_heading, DROP COLUMN IF EXISTS faq_heading_ar,
--     DROP COLUMN IF EXISTS faq_description, DROP COLUMN IF EXISTS faq_description_ar;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS faq_title text NOT NULL DEFAULT 'FAQ',
  ADD COLUMN IF NOT EXISTS faq_title_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_heading text NOT NULL DEFAULT 'Frequently asked questions',
  ADD COLUMN IF NOT EXISTS faq_heading_ar text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS faq_description_ar text NOT NULL DEFAULT '';

COMMENT ON COLUMN public.site_settings.faq_title IS
  'Label for the FAQ homepage section';
COMMENT ON COLUMN public.site_settings.faq_heading IS
  'Headline above the FAQ list';
COMMENT ON COLUMN public.site_settings.faq_description IS
  'Optional intro copy under the FAQ headline';

CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  question_ar text NOT NULL DEFAULT '',
  answer text NOT NULL DEFAULT '',
  answer_ar text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS faqs_sort_idx
  ON public.faqs (sort_order)
  WHERE deleted_at IS NULL;

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS faqs_public_read ON public.faqs;
CREATE POLICY faqs_public_read ON public.faqs
  FOR SELECT TO anon, authenticated
  USING (deleted_at IS NULL AND is_published = true);

DROP POLICY IF EXISTS faqs_admin_all ON public.faqs;
CREATE POLICY faqs_admin_all ON public.faqs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
