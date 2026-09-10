-- What staff actually sent, next to what the assistant proposed.
--
-- Every draft a receptionist edits before sending is a labelled example of the
-- assistant being wrong in a way a human knew how to fix — and all of it was
-- being thrown away. The PATCH handler overwrote the draft body in place on
-- edit and hard-deleted the row on send, leaving nothing to learn from.
--
-- Note the AI's original text is NOT read back from the draft row: an earlier
-- "save" may already have overwritten it. The model's own words live in
-- whatsapp_ai_events.envelope, which is written once at draft time.
--
-- Rollback:
--   DROP TABLE IF EXISTS public.whatsapp_ai_corrections;

CREATE TABLE IF NOT EXISTS public.whatsapp_ai_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid
    REFERENCES public.whatsapp_conversations (id) ON DELETE CASCADE,
  ai_text text NOT NULL,
  sent_text text NOT NULL,
  -- False means staff endorsed the draft unchanged, which is just as useful a
  -- signal as a correction and is what golden cases are promoted from.
  edited boolean NOT NULL,
  intent text,
  reason text,
  model text,
  reviewed boolean NOT NULL DEFAULT false,
  /** Set once an example has been copied into the golden-case fixture. */
  promoted boolean NOT NULL DEFAULT false,
  sent_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS whatsapp_ai_corrections_review_idx
  ON public.whatsapp_ai_corrections (created_at DESC)
  WHERE edited AND NOT promoted;

ALTER TABLE public.whatsapp_ai_corrections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS whatsapp_ai_corrections_admin_all
  ON public.whatsapp_ai_corrections;
CREATE POLICY whatsapp_ai_corrections_admin_all
  ON public.whatsapp_ai_corrections
  FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
