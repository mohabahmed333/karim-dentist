-- The knowledge search never folded Arabic spelling variants, so a patient
-- asking about "اسنان" (the ordinary, hamza-dropped way almost everyone
-- types it) found nothing for an entry written "أسنان" — different Unicode
-- text to Postgres's 'simple' tsvector, even though no patient would ever
-- notice the difference reading either one.
--
-- Scoped to the three substitutions that actually matter for how people type
-- on a phone: hamza-carrying alef, alef maqsura, and ta marbuta. Diacritics
-- and tatweel are left alone here — nobody messages a dentist in fully
-- vocalised Modern Standard Arabic — unlike the stricter version in
-- normalizeArabic.ts, which also has to withstand a deliberately awkward
-- adversarial message, not just an ordinary one.
--
-- Rollback:
--   ALTER TABLE public.clinic_knowledge DROP COLUMN search_vector;
--   ALTER TABLE public.clinic_knowledge ADD COLUMN search_vector tsvector
--     GENERATED ALWAYS AS (
--       to_tsvector('simple'::regconfig,
--         coalesce(title, '') || ' ' || coalesce(title_ar, '') || ' ' ||
--         coalesce(body, '') || ' ' || coalesce(body_ar, ''))
--     ) STORED;
--   CREATE INDEX IF NOT EXISTS clinic_knowledge_search_idx
--     ON public.clinic_knowledge USING gin (search_vector);
--   DROP FUNCTION IF EXISTS public.normalize_arabic_text(text);

CREATE OR REPLACE FUNCTION public.normalize_arabic_text(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  -- أ إ آ ٱ -> ا, ى -> ي, ة -> ه. translate() maps each `from` character to
  -- the character at the same position in `to` — six in, six out, checked
  -- programmatically before this migration was written, not eyeballed.
  SELECT translate(coalesce(input, ''), 'أإآٱىة', 'اااايه');
$$;

COMMENT ON FUNCTION public.normalize_arabic_text(text) IS
  'Folds hamza-carrying alef, alef maqsura and ta marbuta to their plain '
  'forms, so casual Arabic spelling variants match the same tsvector '
  'lexeme. Mirrors src/services/whatsapp_ai/normalizeArabic.ts, minus the '
  'diacritic/tatweel stripping that TypeScript version also does — not '
  'worth it here, since nobody types a dentist a fully-vocalised message.';

-- A generated column's expression cannot be altered in place; it has to be
-- dropped and re-added, which recomputes it for every existing row — trivial
-- at a few hundred entries, and the point of the change.
ALTER TABLE public.clinic_knowledge DROP COLUMN search_vector;

ALTER TABLE public.clinic_knowledge ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector(
      'simple'::regconfig,
      public.normalize_arabic_text(coalesce(title, '')) || ' ' ||
      public.normalize_arabic_text(coalesce(title_ar, '')) || ' ' ||
      public.normalize_arabic_text(coalesce(body, '')) || ' ' ||
      public.normalize_arabic_text(coalesce(body_ar, ''))
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS clinic_knowledge_search_idx
  ON public.clinic_knowledge USING gin (search_vector);

-- The query side must fold the same way, or "اسنان" would tokenise to a
-- lexeme the (now-folded) stored vector no longer contains at all.
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
  FROM unnest(to_tsvector(
    'simple'::regconfig,
    public.normalize_arabic_text(coalesce(p_query, ''))
  ));

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
