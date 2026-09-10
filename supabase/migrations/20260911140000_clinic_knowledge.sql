-- A searchable knowledge base for the WhatsApp assistant.
--
-- Today the assistant is given opening hours, service *titles*, five open slots
-- and the clinic address. It has no prices, no FAQs, no doctor bios, no
-- insurance details, no pre- or post-operative instructions — so it correctly
-- but constantly hands off. This is the table those answers live in.
--
-- Retrieval is Postgres full-text, not embeddings. At a few hundred entries it
-- matches as well, costs nothing per query, adds no infrastructure, and — the
-- part that matters at 2am — you can see exactly why an entry matched. The
-- 'simple' configuration is used deliberately: it needs no extension and no
-- language guess, which matters for a table holding both Arabic and English.
--
-- Rollback:
--   DROP FUNCTION IF EXISTS public.search_clinic_knowledge(text, integer);
--   DROP TABLE IF EXISTS public.clinic_knowledge;

CREATE TABLE IF NOT EXISTS public.clinic_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_ar text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  body_ar text NOT NULL DEFAULT '',
  -- Free-form retrieval hints: 'pricing', 'insurance', 'parking', 'post-op'.
  tags text[] NOT NULL DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  -- Tags are deliberately absent from this vector: casting text[] to text is
  -- an I/O cast, which Postgres treats as STABLE, and a generated column needs
  -- an IMMUTABLE expression. Tags remain a filter, not a search term.
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'simple'::regconfig,
      coalesce(title, '') || ' ' ||
      coalesce(title_ar, '') || ' ' ||
      coalesce(body, '') || ' ' ||
      coalesce(body_ar, '')
    )
  ) STORED
);

CREATE INDEX IF NOT EXISTS clinic_knowledge_search_idx
  ON public.clinic_knowledge USING gin (search_vector);
CREATE INDEX IF NOT EXISTS clinic_knowledge_sort_idx
  ON public.clinic_knowledge (sort_order) WHERE deleted_at IS NULL;

ALTER TABLE public.clinic_knowledge ENABLE ROW LEVEL SECURITY;

-- Admin-only. Unlike faqs there is no public read policy: this is written for
-- the assistant, and may hold operational detail the website should not show.
DROP POLICY IF EXISTS clinic_knowledge_admin_all ON public.clinic_knowledge;
CREATE POLICY clinic_knowledge_admin_all ON public.clinic_knowledge
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Retrieval.
--
-- The patient's message is tokenised with the same configuration as the stored
-- vector, and those lexemes are OR-ed together. That matters more than it
-- looks: websearch_to_tsquery and plainto_tsquery both AND their terms, and the
-- 'simple' configuration removes no stopwords, so "how much is teeth
-- whitening?" would require an entry containing "how", "much" and "is". It
-- matched nothing at all. OR plus ts_rank asks the right question — which entry
-- shares the most meaningful words — and the caller drops anything below a
-- minimum rank so a single common word cannot drag in an unrelated entry.
--
-- Building the query from to_tsvector output is also what makes arbitrary
-- public text safe: lexemes are quoted individually, so no tsquery operator a
-- patient types can survive into the query.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_clinic_knowledge(
  p_query text,
  p_limit integer DEFAULT 4
)
RETURNS TABLE (id uuid, title text, title_ar text, body text, body_ar text, rank real)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_terms text;
  v_query tsquery;
BEGIN
  SELECT string_agg(quote_literal(lexeme), ' | ')
  INTO v_terms
  FROM unnest(to_tsvector('simple'::regconfig, coalesce(p_query, '')));

  IF v_terms IS NULL THEN
    RETURN;
  END IF;

  v_query := to_tsquery('simple'::regconfig, v_terms);

  RETURN QUERY
  SELECT k.id, k.title, k.title_ar, k.body, k.body_ar,
         ts_rank(k.search_vector, v_query) AS rank
  FROM public.clinic_knowledge k
  WHERE k.deleted_at IS NULL
    AND k.is_published
    AND k.search_vector @@ v_query
  ORDER BY rank DESC, k.sort_order ASC
  LIMIT greatest(1, least(coalesce(p_limit, 4), 10));
END;
$fn$;

REVOKE ALL ON FUNCTION public.search_clinic_knowledge(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_clinic_knowledge(text, integer)
  TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Seed from what the clinic has already written, so the table is useful on the
-- first day rather than empty. Idempotent: only runs into an empty table.
-- ---------------------------------------------------------------------------
INSERT INTO public.clinic_knowledge (title, title_ar, body, body_ar, tags, sort_order)
SELECT f.question, f.question_ar, f.answer, f.answer_ar, ARRAY['faq'], f.sort_order
FROM public.faqs f
WHERE f.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.clinic_knowledge LIMIT 1);

INSERT INTO public.clinic_knowledge (title, title_ar, body, body_ar, tags, sort_order)
SELECT s.title, coalesce(s.title_ar, ''), coalesce(s.description, ''),
       coalesce(s.description_ar, ''), ARRAY['service'], 100 + s.sort_order
FROM public.services s
WHERE s.deleted_at IS NULL
  AND s.is_published
  AND NOT EXISTS (
    SELECT 1 FROM public.clinic_knowledge k WHERE 'service' = ANY(k.tags) LIMIT 1
  );
